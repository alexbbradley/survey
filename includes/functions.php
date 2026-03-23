<?php
require_once __DIR__ . '/db.php';

function isLoggedIn(): bool {
    return !empty($_SESSION['user_id']);
}

function requireLogin(): void {
    if (!isLoggedIn()) {
        jsonResponse(['error' => 'Unauthorized'], 401);
        exit;
    }
}

function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
}

/**
 * Send a JSON response to the browser immediately, then allow PHP to keep
 * running (e.g. to send email without making the client wait).
 */
function flushJsonResponse(array $data, int $status = 200): void {
    while (ob_get_level()) ob_end_clean(); // discard any buffered output
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Connection: close');
    $body = json_encode($data);
    header('Content-Length: ' . strlen($body));
    echo $body;
    flush();
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request(); // PHP-FPM / FastCGI
    }
    ignore_user_abort(true); // keep running even though browser disconnected
}

function getInput(): array {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function generateSlug(int $length = 8): string {
    $chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    $slug = '';
    for ($i = 0; $i < $length; $i++) {
        $slug .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $slug;
}

function getUniqueSlug(): string {
    $db = getDB();
    do {
        $slug = generateSlug();
        $stmt = $db->prepare('SELECT id FROM charts WHERE slug = ?');
        $stmt->execute([$slug]);
    } while ($stmt->fetch());
    return $slug;
}

function sanitizeDate(?string $date): ?string {
    if (!$date) return null;
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return ($d && $d->format('Y-m-d') === $date) ? $date : null;
}

// ── Admin helpers ────────────────────────────────────────────────
function isAdmin(): bool {
    return !empty($_SESSION['is_admin']);
}

function requireAdmin(): void {
    requireLogin();
    if (!isAdmin()) {
        jsonResponse(['error' => 'Admin access required'], 403);
        exit;
    }
}

// ── Brute-force protection ───────────────────────────────────────
const BRUTE_MAX_ATTEMPTS    = 5;
const BRUTE_WINDOW_MINUTES  = 15;

function getClientIP(): string {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Returns brute-force status for the given IP.
 * ['blocked' => bool, 'remaining' => int, 'waitMinutes' => int]
 */
function getBruteForceStatus(string $ip): array {
    $db          = getDB();
    $windowStart = date('Y-m-d H:i:s', time() - BRUTE_WINDOW_MINUTES * 60);

    $stmt = $db->prepare(
        'SELECT COUNT(*) AS cnt, MIN(attempted_at) AS oldest
         FROM login_attempts WHERE ip = ? AND attempted_at > ?'
    );
    $stmt->execute([$ip, $windowStart]);
    $row   = $stmt->fetch();
    $count = (int)$row['cnt'];

    $blocked     = $count >= BRUTE_MAX_ATTEMPTS;
    $waitSeconds = 0;

    if ($blocked && $row['oldest']) {
        $unlockTime  = strtotime($row['oldest']) + BRUTE_WINDOW_MINUTES * 60;
        $waitSeconds = max(0, $unlockTime - time());
    }

    return [
        'blocked'     => $blocked,
        'remaining'   => max(0, BRUTE_MAX_ATTEMPTS - $count),
        'waitMinutes' => (int)ceil($waitSeconds / 60),
    ];
}

function recordFailedAttempt(string $ip, string $email): void {
    $db = getDB();
    $db->prepare('INSERT INTO login_attempts (ip, email) VALUES (?, ?)')->execute([$ip, $email]);
    // Prune old records to keep the table lean
    $db->exec("DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)");
}

function clearLoginAttempts(string $ip): void {
    $db = getDB();
    $db->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);
}

// ── Email ────────────────────────────────────────────────────────

/**
 * Send an HTML email via PHPMailer / SMTP.
 * Returns true on success, false on failure (error is logged).
 */
/**
 * Send an email via SMTP.
 * Returns ['ok' => true] on success, or ['ok' => false, 'error' => string] on failure.
 */
function sendMail(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody = ''): array {
    require_once __DIR__ . '/../vendor/autoload.php';
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        // Port 465 = SSL/TLS (SMTPS); port 587 = STARTTLS — pick the right mode automatically
        $mail->SMTPSecure = (SMTP_PORT === 465)
            ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        $mail->Timeout    = 10; // seconds — prevents hanging on bad SMTP config
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
        $mail->addAddress($toEmail, $toName ?: $toEmail);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $htmlBody));
        $mail->send();
        return ['ok' => true];
    } catch (\Exception $e) {
        $msg = $e->getMessage();
        error_log('PHPMailer error: ' . $msg);
        return ['ok' => false, 'error' => $msg];
    }
}

/**
 * Create (or replace) a password-reset token for $userId.
 * Returns the plain token (64 hex chars).
 */
function generateResetToken(int $userId, int $hours = 1): string {
    $db    = getDB();
    $token = bin2hex(random_bytes(32)); // 64 hex chars, cryptographically random
    // Invalidate any existing tokens for this user
    $db->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$userId]);
    $db->prepare(
        'INSERT INTO password_resets (user_id, token, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))'
    )->execute([$userId, $token, $hours]);
    return $token;
}

/**
 * Shared email template wrapper.
 */
function emailTemplate(string $heading, string $bodyHtml): string {
    $from = htmlspecialchars(SMTP_FROM_NAME);
    return "<!DOCTYPE html><html><head><meta charset='UTF-8'>
<style>
  body{font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:24px}
  .card{max-width:480px;margin:0 auto;background:#fff;border-radius:10px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  h1{font-size:20px;color:#111;margin-top:0}
  p{color:#444;line-height:1.6;font-size:15px}
  .btn{display:inline-block;margin-top:8px;padding:10px 22px;background:#4A90E2;color:#fff;text-decoration:none;border-radius:7px;font-weight:600}
  .footer{margin-top:24px;font-size:12px;color:#999}
</style></head><body>
<div class='card'>
  <h1>{$heading}</h1>
  {$bodyHtml}
  <div class='footer'>&copy; {$from}</div>
</div></body></html>";
}
