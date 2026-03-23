<?php
/**
 * api.php — all API endpoints, called via fetch() from gantt.js
 * Usage: api.php?action=<action>  (POST body is JSON)
 */
require_once __DIR__ . '/includes/functions.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ── Auth ────────────────────────────────────────────────────
        case 'login':
            $data     = getInput();
            $email    = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
            $password = $data['password'] ?? '';

            if (!$email || !$password) {
                jsonResponse(['error' => 'Email and password required'], 400);
                break;
            }

            $ip = getClientIP();
            $bf = getBruteForceStatus($ip);

            if ($bf['blocked']) {
                jsonResponse([
                    'error'       => "Too many failed attempts. Please wait {$bf['waitMinutes']} minute(s) before trying again.",
                    'locked'      => true,
                    'waitMinutes' => $bf['waitMinutes'],
                ], 429);
                break;
            }

            $db   = getDB();
            $stmt = $db->prepare('SELECT id, password_hash, is_admin FROM users WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            // Always run password_verify (even on no-user) to prevent timing attacks
            $hash = $user ? $user['password_hash'] : '$2y$10$invalidhashfortimingnobodycanloginwiththis';
            $ok   = password_verify($password, $hash) && $user;

            if ($ok) {
                clearLoginAttempts($ip);
                $_SESSION['user_id']  = $user['id'];
                $_SESSION['email']    = $email;
                $_SESSION['is_admin'] = (bool)$user['is_admin'];
                jsonResponse(['ok' => true, 'email' => $email, 'is_admin' => (bool)$user['is_admin'], 'user_id' => $user['id']]);
            } else {
                recordFailedAttempt($ip, $email);
                $bf2 = getBruteForceStatus($ip);
                if ($bf2['blocked']) {
                    jsonResponse([
                        'error'       => "Too many failed attempts. Please wait {$bf2['waitMinutes']} minute(s) before trying again.",
                        'locked'      => true,
                        'waitMinutes' => $bf2['waitMinutes'],
                    ], 429);
                } else {
                    $left = $bf2['remaining'];
                    $warn = $left === 1 ? "1 attempt remaining before lockout." : "{$left} attempts remaining before lockout.";
                    jsonResponse(['error' => "Invalid credentials. {$warn}", 'attemptsLeft' => $left], 401);
                }
            }
            break;

        case 'logout':
            session_destroy();
            jsonResponse(['ok' => true]);
            break;

        case 'check_auth':
            jsonResponse([
                'loggedIn' => isLoggedIn(),
                'email'    => $_SESSION['email'] ?? null,
                'is_admin' => isAdmin(),
                'user_id'  => $_SESSION['user_id'] ?? null,
            ]);
            break;

        // ── Password reset ──────────────────────────────────────────
        case 'forgot_password':
            $data  = getInput();
            $email = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);

            if (!$email) {
                jsonResponse(['error' => 'A valid email address is required'], 400);
                break;
            }

            // Rate-limit via brute-force mechanism (same IP window)
            $ip = getClientIP();
            $bf = getBruteForceStatus($ip);
            if ($bf['blocked']) {
                // Still return 200 to prevent enumeration, but don't send email
                jsonResponse(['ok' => true, 'message' => 'If that email is registered, a reset link has been sent.']);
                break;
            }
            // Record this as an attempt so the IP can be rate-limited
            recordFailedAttempt($ip, $email);

            $db   = getDB();
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            // Always return the same response (prevents email enumeration)
            if ($user) {
                $token = generateResetToken((int)$user['id'], 1);
                $link  = SITE_URL . '/reset-password.php?token=' . urlencode($token);
                $html  = emailTemplate('Reset your password',
                    "<p>We received a request to reset the password for <strong>" . htmlspecialchars($email) . "</strong>.</p>
                     <p><a class='btn' href='" . htmlspecialchars($link) . "'>Reset Password</a></p>
                     <p>This link expires in <strong>1 hour</strong>. If you did not request a reset, you can safely ignore this email.</p>");
                $mailResult = sendMail($email, '', 'Reset your Gantt password', $html);
                if (!$mailResult['ok']) {
                    error_log('forgot_password mail failed for ' . $email . ': ' . $mailResult['error']);
                }
            }

            jsonResponse(['ok' => true, 'message' => 'If that email is registered, a reset link has been sent.']);
            break;

        case 'reset_password':
            $data     = getInput();
            $token    = trim($data['token'] ?? '');
            $password = $data['password'] ?? '';

            // Validate token format (64 hex chars)
            if (strlen($token) !== 64 || !ctype_xdigit($token)) {
                jsonResponse(['error' => 'Invalid reset link.'], 400);
                break;
            }
            if (strlen($password) < 6) {
                jsonResponse(['error' => 'Password must be at least 6 characters.'], 400);
                break;
            }

            $db   = getDB();
            $stmt = $db->prepare(
                'SELECT pr.user_id, pr.token, pr.expires_at, u.email
                 FROM password_resets pr
                 JOIN users u ON u.id = pr.user_id
                 WHERE pr.token = ?'
            );
            $stmt->execute([$token]);
            $row = $stmt->fetch();

            if (!$row || !hash_equals($row['token'], $token)) {
                jsonResponse(['error' => 'Invalid or expired reset link.'], 400);
                break;
            }
            if (strtotime($row['expires_at']) < time()) {
                $db->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$row['user_id']]);
                jsonResponse(['error' => 'Reset link has expired. Please request a new one.'], 400);
                break;
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $row['user_id']]);
            $db->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$row['user_id']]);
            clearLoginAttempts(getClientIP());

            jsonResponse(['ok' => true]);
            break;

        // ── User management (admin only) ────────────────────────────
        case 'list_users':
            requireAdmin();
            $db   = getDB();
            $rows = $db->query('SELECT id, email, is_admin, created_at FROM users ORDER BY id ASC')->fetchAll();
            jsonResponse($rows);
            break;

        case 'create_user':
            requireAdmin();
            $data     = getInput();
            $email    = filter_var(trim($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
            $isAdminU = empty($data['is_admin']) ? 0 : 1;

            if (!$email) {
                jsonResponse(['error' => 'A valid email address is required'], 400);
                break;
            }

            try {
                // Use an unguessable placeholder hash so the account can't be used until the user sets a password
                $placeholder = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
                $db   = getDB();
                $stmt = $db->prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)');
                $stmt->execute([$email, $placeholder, $isAdminU]);
                $newId = (int)$db->lastInsertId();

                // Generate a 24-hour setup link
                $token = generateResetToken($newId, 24);
                $link  = SITE_URL . '/reset-password.php?token=' . urlencode($token);

                // Flush the response to the browser immediately — don't make the
                // admin wait for the SMTP connection attempt.
                flushJsonResponse([
                    'ok'         => true,
                    'user'       => ['id' => $newId, 'email' => $email, 'is_admin' => $isAdminU],
                    'setup_link' => $link,
                ]);

                // Attempt email in the background (browser already has the response)
                $html = emailTemplate('Your Gantt account is ready',
                    "<p>An account has been created for you on Gantt.</p>
                     <p>Click the button below to set your password and get started:</p>
                     <p><a class='btn' href='" . htmlspecialchars($link) . "'>Set My Password</a></p>
                     <p>This link expires in <strong>24 hours</strong>.</p>");
                $mailResult = sendMail($email, '', 'Your Gantt account is ready', $html);
                if (!$mailResult['ok']) {
                    error_log('create_user mail failed for ' . $email . ': ' . $mailResult['error']);
                }
                exit;
            } catch (PDOException $e) {
                if ($e->getCode() === '23000') {
                    jsonResponse(['error' => 'An account with that email already exists'], 409);
                } else { throw $e; }
            }
            break;

        case 'delete_user':
            requireAdmin();
            $data = getInput();
            $id   = (int)($data['id'] ?? 0);
            if (!$id) { jsonResponse(['error' => 'Missing id'], 400); break; }
            if ($id === (int)$_SESSION['user_id']) {
                jsonResponse(['error' => 'You cannot delete your own account'], 400); break;
            }
            $db = getDB();
            $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
            jsonResponse(['ok' => true]);
            break;

        case 'change_password':
            requireLogin();
            $data     = getInput();
            $targetId = (int)($data['user_id'] ?? 0);
            $password = $data['password'] ?? '';

            // Admins can change anyone's password; others can only change their own
            if (!isAdmin() && $targetId !== (int)$_SESSION['user_id']) {
                jsonResponse(['error' => 'Unauthorized'], 403); break;
            }
            if (strlen($password) < 6) { jsonResponse(['error' => 'Password must be at least 6 characters'], 400); break; }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $db   = getDB();
            $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $targetId]);
            jsonResponse(['ok' => true]);
            break;

        // ── Charts ──────────────────────────────────────────────────
        case 'list_charts':
            $db = getDB();
            if (isAdmin()) {
                $rows = $db->query('SELECT id, slug, title, view_start, view_end, view_mode, created_at FROM charts WHERE deleted_at IS NULL ORDER BY created_at DESC')->fetchAll();
            } else {
                $stmt = $db->prepare('SELECT id, slug, title, view_start, view_end, view_mode, created_at FROM charts WHERE deleted_at IS NULL AND user_id = ? ORDER BY created_at DESC');
                $stmt->execute([(int)($_SESSION['user_id'] ?? 0)]);
                $rows = $stmt->fetchAll();
            }
            jsonResponse($rows);
            break;

        case 'get_chart':
            $slug = $_GET['slug'] ?? '';
            if (!$slug) { jsonResponse(['error' => 'Missing slug'], 400); break; }

            $db = getDB();
            $stmt = $db->prepare('SELECT * FROM charts WHERE slug = ?');
            $stmt->execute([$slug]);
            $chart = $stmt->fetch();

            if (!$chart) { jsonResponse(['error' => 'Chart not found'], 404); break; }
            jsonResponse($chart);
            break;

        case 'create_chart':
            requireLogin();
            $data = getInput();
            $title      = trim($data['title'] ?? '');
            $viewStart  = sanitizeDate($data['view_start'] ?? '');
            $viewEnd    = sanitizeDate($data['view_end'] ?? '');
            $viewMode   = in_array($data['view_mode'] ?? '', ['day','week']) ? $data['view_mode'] : 'week';
            $customSlug = trim($data['slug'] ?? '');

            if (!$title || !$viewStart || !$viewEnd) {
                jsonResponse(['error' => 'Title, start date and end date are required'], 400); break;
            }
            if ($viewStart >= $viewEnd) {
                jsonResponse(['error' => 'Start date must be before end date'], 400); break;
            }

            if ($customSlug !== '') {
                if (!preg_match('/^[a-z0-9][a-z0-9\-]{1,58}[a-z0-9]$/', $customSlug) && !preg_match('/^[a-z0-9]{2,60}$/', $customSlug)) {
                    jsonResponse(['error' => 'URL slug may only contain lowercase letters, numbers, and hyphens (2–60 characters)'], 400); break;
                }
                $db = getDB();
                $exists = $db->prepare('SELECT id FROM charts WHERE slug = ?');
                $exists->execute([$customSlug]);
                if ($exists->fetch()) {
                    jsonResponse(['error' => 'That URL slug is already taken'], 409); break;
                }
                $slug = $customSlug;
            } else {
                $db = getDB();
                $slug = getUniqueSlug();
            }

            $stmt = $db->prepare('INSERT INTO charts (user_id, slug, title, view_start, view_end, view_mode) VALUES (?,?,?,?,?,?)');
            $stmt->execute([(int)$_SESSION['user_id'], $slug, $title, $viewStart, $viewEnd, $viewMode]);
            $id = (int)$db->lastInsertId();

            jsonResponse(['ok' => true, 'id' => $id, 'slug' => $slug]);
            break;

        case 'update_chart':
            requireLogin();
            $data = getInput();
            $id        = (int)($data['id'] ?? 0);
            $title     = trim($data['title'] ?? '');
            $viewStart = sanitizeDate($data['view_start'] ?? '');
            $viewEnd   = sanitizeDate($data['view_end'] ?? '');
            $viewMode  = in_array($data['view_mode'] ?? '', ['day','week']) ? $data['view_mode'] : 'week';

            if (!$id || !$title || !$viewStart || !$viewEnd) {
                jsonResponse(['error' => 'Missing required fields'], 400); break;
            }
            if ($viewStart >= $viewEnd) {
                jsonResponse(['error' => 'Start date must be before end date'], 400); break;
            }

            $db = getDB();
            $own = $db->prepare('SELECT user_id FROM charts WHERE id = ?');
            $own->execute([$id]);
            $ownerRow = $own->fetch();
            if (!$ownerRow || (!isAdmin() && (int)$ownerRow['user_id'] !== (int)$_SESSION['user_id'])) {
                jsonResponse(['error' => 'Unauthorized'], 403); break;
            }
            $db->prepare('UPDATE charts SET title=?, view_start=?, view_end=?, view_mode=? WHERE id=?')->execute([$title, $viewStart, $viewEnd, $viewMode, $id]);
            jsonResponse(['ok' => true]);
            break;

        case 'rename_chart':
            requireLogin();
            $data  = getInput();
            $id    = (int)($data['id'] ?? 0);
            $title = trim($data['title'] ?? '');
            $slug  = trim($data['slug'] ?? '');
            if (!$id || !$title || !$slug) { jsonResponse(['error' => 'Missing required fields'], 400); break; }
            if (!preg_match('/^[a-z0-9][a-z0-9\-]{0,58}[a-z0-9]$/', $slug) && !preg_match('/^[a-z0-9]{2,60}$/', $slug)) {
                jsonResponse(['error' => 'Slug may only contain lowercase letters, numbers, and hyphens (2–60 chars)'], 400); break;
            }

            $db = getDB();
            $own = $db->prepare('SELECT user_id FROM charts WHERE id = ?');
            $own->execute([$id]);
            $ownerRow = $own->fetch();
            if (!$ownerRow || (!isAdmin() && (int)$ownerRow['user_id'] !== (int)$_SESSION['user_id'])) {
                jsonResponse(['error' => 'Unauthorized'], 403); break;
            }

            // Check slug uniqueness (excluding this chart)
            $taken = $db->prepare('SELECT id FROM charts WHERE slug = ? AND id != ?');
            $taken->execute([$slug, $id]);
            if ($taken->fetch()) { jsonResponse(['error' => 'That URL slug is already taken'], 409); break; }

            $db->prepare('UPDATE charts SET title=?, slug=? WHERE id=?')->execute([$title, $slug, $id]);
            jsonResponse(['ok' => true, 'slug' => $slug]);
            break;

        case 'duplicate_chart':
            requireLogin();
            $data = getInput();
            $id = (int)($data['id'] ?? 0);
            if (!$id) { jsonResponse(['error' => 'Missing id'], 400); break; }

            $db = getDB();
            $own = $db->prepare('SELECT * FROM charts WHERE id = ? AND deleted_at IS NULL');
            $own->execute([$id]);
            $src = $own->fetch(PDO::FETCH_ASSOC);
            if (!$src || (!isAdmin() && (int)$src['user_id'] !== (int)$_SESSION['user_id'])) {
                jsonResponse(['error' => 'Unauthorized'], 403); break;
            }

            $newSlug  = getUniqueSlug();
            $newTitle = 'Copy of ' . $src['title'];
            $db->prepare('INSERT INTO charts (user_id, slug, title, view_start, view_end, view_mode) VALUES (?,?,?,?,?,?)')
               ->execute([(int)$_SESSION['user_id'], $newSlug, $newTitle, $src['view_start'], $src['view_end'], $src['view_mode']]);
            $newId = (int)$db->lastInsertId();

            // Copy all tasks
            $tasks = $db->prepare('SELECT type, title, note, start_date, end_date, color, sort_order FROM tasks WHERE chart_id = ? ORDER BY sort_order');
            $tasks->execute([$id]);
            $ins = $db->prepare('INSERT INTO tasks (chart_id, type, title, note, start_date, end_date, color, sort_order) VALUES (?,?,?,?,?,?,?,?)');
            foreach ($tasks->fetchAll(PDO::FETCH_ASSOC) as $t) {
                $ins->execute([$newId, $t['type'], $t['title'], $t['note'], $t['start_date'], $t['end_date'], $t['color'], $t['sort_order']]);
            }

            $row = $db->prepare('SELECT id, slug, title, view_start, view_end, view_mode FROM charts WHERE id = ?');
            $row->execute([$newId]);
            jsonResponse(['ok' => true, 'chart' => $row->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'delete_chart':
            requireLogin();
            $data = getInput();
            $id = (int)($data['id'] ?? 0);
            if (!$id) { jsonResponse(['error' => 'Missing id'], 400); break; }

            $db = getDB();
            $own = $db->prepare('SELECT user_id FROM charts WHERE id = ?');
            $own->execute([$id]);
            $ownerRow = $own->fetch();
            if (!$ownerRow || (!isAdmin() && (int)$ownerRow['user_id'] !== (int)$_SESSION['user_id'])) {
                jsonResponse(['error' => 'Unauthorized'], 403); break;
            }
            $db->prepare('UPDATE charts SET deleted_at = NOW() WHERE id = ?')->execute([$id]);
            jsonResponse(['ok' => true]);
            break;

        case 'list_bin':
            requireLogin();
            $db = getDB();
            if (isAdmin()) {
                $rows = $db->query('SELECT id, slug, title, view_start, view_end, view_mode, deleted_at FROM charts WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC')->fetchAll();
            } else {
                $stmt = $db->prepare('SELECT id, slug, title, view_start, view_end, view_mode, deleted_at FROM charts WHERE deleted_at IS NOT NULL AND user_id = ? ORDER BY deleted_at DESC');
                $stmt->execute([(int)$_SESSION['user_id']]);
                $rows = $stmt->fetchAll();
            }
            jsonResponse($rows);
            break;

        case 'restore_chart':
            requireLogin();
            $data = getInput();
            $id = (int)($data['id'] ?? 0);
            if (!$id) { jsonResponse(['error' => 'Missing id'], 400); break; }

            $db = getDB();
            $own = $db->prepare('SELECT user_id FROM charts WHERE id = ?');
            $own->execute([$id]);
            $ownerRow = $own->fetch();
            if (!$ownerRow || (!isAdmin() && (int)$ownerRow['user_id'] !== (int)$_SESSION['user_id'])) {
                jsonResponse(['error' => 'Unauthorized'], 403); break;
            }
            $db->prepare('UPDATE charts SET deleted_at = NULL WHERE id = ?')->execute([$id]);
            jsonResponse(['ok' => true]);
            break;

        case 'purge_chart':
            requireLogin();
            $data = getInput();
            $id = (int)($data['id'] ?? 0);
            if (!$id) { jsonResponse(['error' => 'Missing id'], 400); break; }

            $db = getDB();
            $own = $db->prepare('SELECT user_id FROM charts WHERE id = ?');
            $own->execute([$id]);
            $ownerRow = $own->fetch();
            if (!$ownerRow || (!isAdmin() && (int)$ownerRow['user_id'] !== (int)$_SESSION['user_id'])) {
                jsonResponse(['error' => 'Unauthorized'], 403); break;
            }
            $db->prepare('DELETE FROM charts WHERE id = ? AND deleted_at IS NOT NULL')->execute([$id]);
            jsonResponse(['ok' => true]);
            break;

        case 'purge_bin':
            requireLogin();
            $db = getDB();
            if (isAdmin()) {
                $db->exec('DELETE FROM charts WHERE deleted_at IS NOT NULL');
            } else {
                $db->prepare('DELETE FROM charts WHERE deleted_at IS NOT NULL AND user_id = ?')->execute([(int)$_SESSION['user_id']]);
            }
            jsonResponse(['ok' => true]);
            break;

        // ── Tasks ───────────────────────────────────────────────────
        case 'get_tasks':
            $chartId = (int)($_GET['chart_id'] ?? 0);
            if (!$chartId) { jsonResponse(['error' => 'Missing chart_id'], 400); break; }

            $db = getDB();
            $stmt = $db->prepare('SELECT * FROM tasks WHERE chart_id = ? ORDER BY sort_order ASC, id ASC');
            $stmt->execute([$chartId]);
            jsonResponse($stmt->fetchAll());
            break;

        case 'create_task':
            requireLogin();
            $data     = getInput();
            $chartId  = (int)($data['chart_id'] ?? 0);
            $type     = in_array($data['type'] ?? '', ['task','section','launch']) ? $data['type'] : 'task';
            $title    = trim($data['title'] ?? '');
            $note     = trim($data['note'] ?? '');
            $start    = sanitizeDate($data['start_date'] ?? '');
            $end      = sanitizeDate($data['end_date'] ?? '');
            $color    = preg_match('/^#[0-9A-Fa-f]{6}$/', $data['color'] ?? '') ? $data['color'] : '#4A90E2';

            if (!$chartId || !$title) { jsonResponse(['error' => 'chart_id and title required'], 400); break; }

            // Get next sort_order
            $db = getDB();
            $max = $db->prepare('SELECT COALESCE(MAX(sort_order),0)+1 FROM tasks WHERE chart_id=?');
            $max->execute([$chartId]);
            $order = (int)$max->fetchColumn();

            $stmt = $db->prepare('INSERT INTO tasks (chart_id, type, title, note, start_date, end_date, color, sort_order) VALUES (?,?,?,?,?,?,?,?)');
            $stmt->execute([$chartId, $type, $title, $note ?: null, $start, $end, $color, $order]);
            $id = (int)$db->lastInsertId();

            // Return full task
            $t = $db->prepare('SELECT * FROM tasks WHERE id=?');
            $t->execute([$id]);
            jsonResponse(['ok' => true, 'task' => $t->fetch()]);
            break;

        case 'update_task':
            requireLogin();
            $data   = getInput();
            $id     = (int)($data['id'] ?? 0);
            $title  = trim($data['title'] ?? '');
            $note   = trim($data['note'] ?? '');
            $start  = sanitizeDate($data['start_date'] ?? '');
            $end    = sanitizeDate($data['end_date'] ?? '');
            $color  = preg_match('/^#[0-9A-Fa-f]{6}$/', $data['color'] ?? '') ? $data['color'] : null;

            if (!$id || !$title) { jsonResponse(['error' => 'id and title required'], 400); break; }

            $allowed_types = ['task', 'section', 'launch'];
            $type = in_array($data['type'] ?? '', $allowed_types) ? $data['type'] : null;

            $db = getDB();
            $fields = 'title=?, note=?, start_date=?, end_date=?';
            $params = [$title, $note ?: null, $start, $end];
            if ($color) { $fields .= ', color=?'; $params[] = $color; }
            if ($type)  { $fields .= ', type=?';  $params[] = $type; }
            $params[] = $id;

            $db->prepare("UPDATE tasks SET $fields WHERE id=?")->execute($params);

            $t = $db->prepare('SELECT * FROM tasks WHERE id=?');
            $t->execute([$id]);
            jsonResponse(['ok' => true, 'task' => $t->fetch()]);
            break;

        case 'delete_task':
            requireLogin();
            $data = getInput();
            $id = (int)($data['id'] ?? 0);
            if (!$id) { jsonResponse(['error' => 'Missing id'], 400); break; }

            $db = getDB();
            $db->prepare('DELETE FROM tasks WHERE id=?')->execute([$id]);
            jsonResponse(['ok' => true]);
            break;

        case 'reorder_tasks':
            requireLogin();
            $data    = getInput();
            $chartId = (int)($data['chart_id'] ?? 0);
            $order   = $data['order'] ?? []; // array of task ids in new order

            if (!$chartId || !is_array($order)) { jsonResponse(['error' => 'Invalid input'], 400); break; }

            $db = getDB();
            $stmt = $db->prepare('UPDATE tasks SET sort_order=? WHERE id=? AND chart_id=?');
            foreach ($order as $i => $taskId) {
                $stmt->execute([$i, (int)$taskId, $chartId]);
            }
            jsonResponse(['ok' => true]);
            break;

        default:
            jsonResponse(['error' => 'Unknown action'], 404);
    }
} catch (Throwable $e) {
    jsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
}
