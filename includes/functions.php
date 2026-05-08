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
    while (ob_get_level()) ob_end_clean();
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Connection: close');
    $body = json_encode($data);
    header('Content-Length: ' . strlen($body));
    echo $body;
    flush();
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    }
    ignore_user_abort(true);
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
    $db->exec("DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)");
}

function clearLoginAttempts(string $ip): void {
    $db = getDB();
    $db->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);
}

// ── Email ────────────────────────────────────────────────────────

function sendMail(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody = ''): array {
    require_once __DIR__ . '/../vendor/autoload.php';
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = (SMTP_PORT === 465)
            ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = SMTP_PORT;
        $mail->Timeout    = 10;
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

function generateResetToken(int $userId, int $hours = 1): string {
    $db    = getDB();
    $token = bin2hex(random_bytes(32));
    $db->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$userId]);
    $db->prepare(
        'INSERT INTO password_resets (user_id, token, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))'
    )->execute([$userId, $token, $hours]);
    return $token;
}

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

// ── Anthropic API ─────────────────────────────────────────────────

/**
 * POST a single user message to the Claude Messages API and return the
 * assistant's text reply. Throws on transport or API errors.
 */
function callClaude(string $systemPrompt, string $userPrompt, string $model = 'claude-sonnet-4-6', int $maxTokens = 1500): string {
    if (!defined('ANTHROPIC_API_KEY') || ANTHROPIC_API_KEY === '') {
        throw new RuntimeException('ANTHROPIC_API_KEY is not configured.');
    }

    $payload = [
        'model'       => $model,
        'max_tokens'  => $maxTokens,
        'system'      => $systemPrompt,
        'messages'    => [['role' => 'user', 'content' => $userPrompt]],
    ];

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . ANTHROPIC_API_KEY,
            'anthropic-version: 2023-06-01',
        ],
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 60,
    ]);
    $body = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body === false) {
        throw new RuntimeException('Claude API request failed: ' . $err);
    }
    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Claude API returned invalid JSON');
    }
    if ($http >= 400) {
        $msg = $decoded['error']['message'] ?? ('HTTP ' . $http);
        throw new RuntimeException('Claude API error: ' . $msg);
    }
    $text = '';
    foreach (($decoded['content'] ?? []) as $block) {
        if (($block['type'] ?? '') === 'text') $text .= $block['text'];
    }
    if ($text === '') {
        throw new RuntimeException('Claude API returned no text content');
    }
    return $text;
}

// ── Survey helpers ────────────────────────────────────────────────

/**
 * Validate a survey slug is safe for filesystem use.
 * Only lowercase alphanumeric and hyphens, 1–60 chars.
 */
function isValidSlug(string $slug): bool {
    return (bool)preg_match('/^[a-z0-9]([a-z0-9\-]{0,58}[a-z0-9])?$/', $slug);
}

/**
 * Load a survey definition from surveys/<slug>.php.
 * NEVER passes user input to include() without validating the slug first.
 * Returns the array on success, null if missing or malformed.
 */
function loadSurvey(string $slug): ?array {
    if (!isValidSlug($slug)) return null;
    $path = __DIR__ . '/../surveys/' . $slug . '.php';
    if (!file_exists($path)) return null;
    $survey = include $path;
    if (!is_array($survey) || empty($survey['questions'])) return null;
    return $survey;
}

/**
 * Auto-discover all surveys by scanning surveys/ for *.php files.
 * Returns array of ['slug' => string, 'title' => string].
 */
function discoverSurveys(): array {
    $dir = __DIR__ . '/../surveys/';
    if (!is_dir($dir)) return [];
    $out = [];
    foreach (glob($dir . '*.php') as $file) {
        $slug = basename($file, '.php');
        if (!isValidSlug($slug)) continue;
        $survey = include $file;
        if (!is_array($survey)) continue;
        $out[] = ['slug' => $slug, 'title' => $survey['title'] ?? $slug];
    }
    return $out;
}

/**
 * Sanitize a single question (or group) for client consumption.
 */
function sanitizeQuestion(array $q): array {
    if (($q['type'] ?? '') === 'group') {
        $group = [
            'type'      => 'group',
            'label'     => (string)($q['label'] ?? ''),
            'questions' => array_map('sanitizeQuestion', array_values((array)($q['questions'] ?? []))),
        ];
        if (isset($q['description']))       $group['description']      = (string)$q['description'];
        if (isset($q['layout']))            $group['layout']           = (string)$q['layout'];
        if (!empty($q['paired_exclusive'])) $group['paired_exclusive'] = true;
        return $group;
    }
    $out = [
        'key'      => (string)($q['key'] ?? ''),
        'type'     => (string)($q['type'] ?? 'text'),
        'label'    => (string)($q['label'] ?? ''),
        'required' => !empty($q['required']),
    ];
    if (isset($q['options']))     $out['options']     = array_values((array)$q['options']);
    if (isset($q['items']))       $out['items']       = array_values((array)$q['items']);
    if (isset($q['max']))         $out['max']         = (int)$q['max'];
    if (isset($q['placeholder']))  $out['placeholder']  = (string)$q['placeholder'];
    if (isset($q['description'])) $out['description'] = (string)$q['description'];
    if (isset($q['autocomplete'])) $out['autocomplete'] = (string)$q['autocomplete'];
    if (!empty($q['summary']))    $out['summary']     = true;
    return $out;
}

/**
 * Flatten a questions array, expanding groups into their child questions.
 * Used by responses/CSV where we need a flat list of question keys.
 */
function flattenQuestions(array $questions): array {
    $flat = [];
    foreach ($questions as $q) {
        if (($q['type'] ?? '') === 'group') {
            foreach (($q['questions'] ?? []) as $child) {
                $flat[] = $child;
            }
        } else {
            $flat[] = $q;
        }
    }
    return $flat;
}

/**
 * Build the responses payload for a survey (questions + sessions w/ answers).
 * If $stripPII is true, removes ip_address and the full session_token from
 * each session row — used for the public share view.
 * Returns null if the survey can't be loaded.
 */
function buildResponsesPayload(string $slug, bool $stripPII): ?array {
    $survey = loadSurvey($slug);
    if (!$survey) return null;

    $db = getDB();
    $sessStmt = $db->prepare(
        'SELECT id, session_token, user_id, ip_address, current_question, completed_at, created_at
         FROM survey_sessions WHERE survey_slug = ? ORDER BY created_at DESC'
    );
    $sessStmt->execute([$slug]);
    $rows = $sessStmt->fetchAll();

    if ($rows) {
        $ids = implode(',', array_map(fn($r) => (int)$r['id'], $rows));
        $answers = $db->query(
            "SELECT session_id, question_key, answer_value FROM survey_answers WHERE session_id IN ($ids)"
        )->fetchAll();
        $answerMap = [];
        foreach ($answers as $a) {
            $answerMap[$a['session_id']][$a['question_key']] = $a['answer_value'];
        }
        foreach ($rows as &$row) {
            $row['answers'] = $answerMap[$row['id']] ?? (object)[];
            if ($stripPII) {
                unset($row['ip_address'], $row['session_token'], $row['user_id']);
            }
        }
        unset($row);
    }

    return [
        'questions' => flattenQuestions(sanitizeSurveyForClient($survey)['questions']),
        'sessions'  => $rows,
    ];
}

/**
 * Construct the public shareable URL for a (slug, share_token) pair.
 */
function buildShareUrl(string $slug, string $token): string {
    return rtrim(SITE_URL, '/') . '/?s=' . urlencode($slug) . '&view=responses&t=' . urlencode($token);
}

/**
 * Validate a share token from the URL against the survey_share_tokens table.
 * Returns the slug it grants access to, or null if invalid/missing.
 */
function resolveShareToken(string $token): ?string {
    if (strlen($token) !== 64 || !ctype_xdigit($token)) return null;
    $stmt = getDB()->prepare('SELECT survey_slug FROM survey_share_tokens WHERE share_token = ?');
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ? (string)$row['survey_slug'] : null;
}

/**
 * Strip a survey definition to only what the client needs.
 * Removes any server-side or future metadata keys.
 */
function sanitizeSurveyForClient(array $survey): array {
    return [
        'title'           => (string)($survey['title'] ?? ''),
        'description'     => (string)($survey['description'] ?? ''),
        'thank_you_title' => (string)($survey['thank_you_title'] ?? 'Thank you!'),
        'thank_you'       => (string)($survey['thank_you'] ?? ''),
        'questions'       => array_map('sanitizeQuestion', array_values((array)$survey['questions'])),
    ];
}
