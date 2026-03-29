<?php
/**
 * api.php — all API endpoints, called via fetch() from the survey SPA
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

            $ip = getClientIP();
            $bf = getBruteForceStatus($ip);
            if ($bf['blocked']) {
                jsonResponse(['ok' => true, 'message' => 'If that email is registered, a reset link has been sent.']);
                break;
            }
            recordFailedAttempt($ip, $email);

            $db   = getDB();
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user) {
                $token = generateResetToken((int)$user['id'], 1);
                $link  = SITE_URL . '/reset-password.php?token=' . urlencode($token);
                $html  = emailTemplate('Reset your password',
                    "<p>We received a request to reset the password for <strong>" . htmlspecialchars($email) . "</strong>.</p>
                     <p><a class='btn' href='" . htmlspecialchars($link) . "'>Reset Password</a></p>
                     <p>This link expires in <strong>1 hour</strong>. If you did not request a reset, you can safely ignore this email.</p>");
                $mailResult = sendMail($email, '', 'Reset your ' . APP_NAME . ' password', $html);
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
                $placeholder = password_hash(bin2hex(random_bytes(32)), PASSWORD_DEFAULT);
                $db   = getDB();
                $stmt = $db->prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)');
                $stmt->execute([$email, $placeholder, $isAdminU]);
                $newId = (int)$db->lastInsertId();

                $token = generateResetToken($newId, 24);
                $link  = SITE_URL . '/reset-password.php?token=' . urlencode($token);

                flushJsonResponse([
                    'ok'         => true,
                    'user'       => ['id' => $newId, 'email' => $email, 'is_admin' => $isAdminU],
                    'setup_link' => $link,
                ]);

                $html = emailTemplate('Your ' . APP_NAME . ' account is ready',
                    "<p>An account has been created for you on " . htmlspecialchars(APP_NAME) . ".</p>
                     <p>Click the button below to set your password and get started:</p>
                     <p><a class='btn' href='" . htmlspecialchars($link) . "'>Set My Password</a></p>
                     <p>This link expires in <strong>24 hours</strong>.</p>");
                $mailResult = sendMail($email, '', 'Your ' . APP_NAME . ' account is ready', $html);
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

            if (!isAdmin() && $targetId !== (int)$_SESSION['user_id']) {
                jsonResponse(['error' => 'Unauthorized'], 403); break;
            }
            if (strlen($password) < 6) { jsonResponse(['error' => 'Password must be at least 6 characters'], 400); break; }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $db   = getDB();
            $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $targetId]);
            jsonResponse(['ok' => true]);
            break;

        // ── Survey — public endpoints ────────────────────────────────

        case 'get_survey':
            $slug = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['slug'] ?? ''));
            $survey = loadSurvey($slug);
            if (!$survey) { jsonResponse(['error' => 'Survey not found'], 404); break; }
            jsonResponse(sanitizeSurveyForClient($survey));
            break;

        case 'start_session':
            $data  = getInput();
            $slug  = preg_replace('/[^a-z0-9-]/', '', strtolower($data['slug'] ?? ''));
            $token = trim($data['token'] ?? '');

            $survey = loadSurvey($slug);
            if (!$survey) { jsonResponse(['error' => 'Survey not found'], 404); break; }

            $db = getDB();

            // Try to resume an existing session by token
            if (strlen($token) === 64 && ctype_xdigit($token)) {
                $stmt = $db->prepare(
                    'SELECT id, current_question, completed_at
                     FROM survey_sessions WHERE session_token = ? AND survey_slug = ?'
                );
                $stmt->execute([$token, $slug]);
                $session = $stmt->fetch();

                if ($session) {
                    if ($session['completed_at'] !== null) {
                        jsonResponse([
                            'error'           => 'already_completed',
                            'thank_you_title' => $survey['thank_you_title'] ?? 'Thank you!',
                            'thank_you'       => $survey['thank_you'] ?? '',
                        ], 409);
                        break;
                    }
                    // Resume: load saved answers
                    $aStmt = $db->prepare(
                        'SELECT question_key, answer_value FROM survey_answers WHERE session_id = ?'
                    );
                    $aStmt->execute([$session['id']]);
                    $answers = [];
                    foreach ($aStmt->fetchAll() as $row) {
                        $answers[$row['question_key']] = $row['answer_value'];
                    }
                    jsonResponse([
                        'token'            => $token,
                        'current_question' => (int)$session['current_question'],
                        'answers'          => $answers,
                    ]);
                    break;
                }
                // Token not found — fall through to create a new session
            }

            // Create a new session
            $newToken = bin2hex(random_bytes(32));
            $db->prepare(
                'INSERT INTO survey_sessions (survey_slug, session_token, user_id, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?)'
            )->execute([
                $slug,
                $newToken,
                $_SESSION['user_id'] ?? null,
                getClientIP(),
                substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
            ]);
            jsonResponse(['token' => $newToken, 'current_question' => 0, 'answers' => []]);
            break;

        case 'save_answer':
            $data          = getInput();
            $token         = trim($data['token'] ?? '');
            $questionKey   = trim($data['question_key'] ?? '');
            $answerValue   = $data['answer_value'] ?? '';
            $questionIndex = (int)($data['question_index'] ?? 0);

            if (strlen($token) !== 64 || !ctype_xdigit($token)) {
                jsonResponse(['error' => 'Invalid token'], 400); break;
            }
            if (!$questionKey || strlen($questionKey) > 100) {
                jsonResponse(['error' => 'Invalid question_key'], 400); break;
            }

            $db   = getDB();
            $stmt = $db->prepare(
                'SELECT id FROM survey_sessions WHERE session_token = ? AND completed_at IS NULL'
            );
            $stmt->execute([$token]);
            $session = $stmt->fetch();
            if (!$session) { jsonResponse(['error' => 'Session not found or already completed'], 404); break; }

            $sessionId = (int)$session['id'];

            // Upsert answer
            $db->prepare(
                'INSERT INTO survey_answers (session_id, question_key, answer_value)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE answer_value = VALUES(answer_value), answered_at = NOW()'
            )->execute([$sessionId, $questionKey, (string)$answerValue]);

            // Advance current_question pointer (never regress on Back navigation)
            $db->prepare(
                'UPDATE survey_sessions
                 SET current_question = GREATEST(current_question, ?), updated_at = NOW()
                 WHERE id = ?'
            )->execute([$questionIndex + 1, $sessionId]);

            jsonResponse(['ok' => true]);
            break;

        case 'complete_survey':
            $data  = getInput();
            $token = trim($data['token'] ?? '');

            if (strlen($token) !== 64 || !ctype_xdigit($token)) {
                jsonResponse(['error' => 'Invalid token'], 400); break;
            }

            $db   = getDB();
            $stmt = $db->prepare(
                'UPDATE survey_sessions SET completed_at = NOW(), updated_at = NOW()
                 WHERE session_token = ? AND completed_at IS NULL'
            );
            $stmt->execute([$token]);

            if ($stmt->rowCount() === 0) {
                jsonResponse(['error' => 'Session not found or already completed'], 404); break;
            }
            jsonResponse(['ok' => true]);
            break;

        // ── Survey — admin endpoints ─────────────────────────────────

        case 'list_surveys':
            requireAdmin();
            jsonResponse(discoverSurveys());
            break;

        case 'get_responses':
            requireAdmin();
            $slug   = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['slug'] ?? ''));
            $survey = loadSurvey($slug);
            if (!$survey) { jsonResponse(['error' => 'Survey not found'], 404); break; }

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
                }
                unset($row);
            }

            jsonResponse([
                'questions' => flattenQuestions(sanitizeSurveyForClient($survey)['questions']),
                'sessions'  => $rows,
            ]);
            break;

        case 'export_csv':
            requireAdmin();
            $slug   = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['slug'] ?? ''));
            $survey = loadSurvey($slug);
            if (!$survey) { jsonResponse(['error' => 'Survey not found'], 404); break; }

            $db = getDB();
            $sessStmt = $db->prepare(
                'SELECT id, session_token, ip_address, completed_at, created_at
                 FROM survey_sessions WHERE survey_slug = ? ORDER BY created_at ASC'
            );
            $sessStmt->execute([$slug]);
            $rows = $sessStmt->fetchAll();

            $ids = $rows ? implode(',', array_map(fn($r) => (int)$r['id'], $rows)) : '0';
            $answers = $db->query(
                "SELECT session_id, question_key, answer_value FROM survey_answers WHERE session_id IN ($ids)"
            )->fetchAll();
            $answerMap = [];
            foreach ($answers as $a) {
                $answerMap[$a['session_id']][$a['question_key']] = $a['answer_value'];
            }

            $questions = flattenQuestions(sanitizeSurveyForClient($survey)['questions']);
            $keys      = array_column($questions, 'key');

            while (ob_get_level()) ob_end_clean();
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $slug . '-responses.csv"');
            header('Cache-Control: no-cache');

            $fh = fopen('php://output', 'w');
            fwrite($fh, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel

            // Header row
            $headerRow = ['Session', 'Started', 'Completed', 'IP'];
            foreach ($questions as $q) { $headerRow[] = $q['label']; }
            fputcsv($fh, $headerRow);

            foreach ($rows as $row) {
                $line = [
                    substr($row['session_token'], 0, 8),
                    $row['created_at'],
                    $row['completed_at'] ?? '',
                    $row['ip_address'],
                ];
                foreach ($keys as $key) {
                    $val     = $answerMap[$row['id']][$key] ?? '';
                    $decoded = json_decode($val, true);
                    // Ranking answers stored as JSON array — decode to "A > B > C" format
                    $line[] = is_array($decoded) ? implode(' > ', $decoded) : $val;
                }
                fputcsv($fh, $line);
            }
            fclose($fh);
            exit;

        case 'clear_responses':
            requireAdmin();
            $data = getInput();
            $slug = preg_replace('/[^a-z0-9-]/', '', strtolower($data['slug'] ?? ''));
            if (!isValidSlug($slug)) { jsonResponse(['error' => 'Invalid slug'], 400); break; }

            $db   = getDB();
            $stmt = $db->prepare('DELETE FROM survey_sessions WHERE survey_slug = ?');
            $stmt->execute([$slug]);
            $deleted = $stmt->rowCount();

            jsonResponse(['ok' => true, 'deleted' => $deleted]);
            break;

        default:
            jsonResponse(['error' => 'Unknown action'], 404);
    }
} catch (Throwable $e) {
    jsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
}
