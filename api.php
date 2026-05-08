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
            $slug    = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['slug'] ?? ''));
            $payload = buildResponsesPayload($slug, false);
            if (!$payload) { jsonResponse(['error' => 'Survey not found'], 404); break; }
            jsonResponse($payload);
            break;

        case 'get_responses_public':
            $token = trim($_GET['token'] ?? '');
            $slug  = resolveShareToken($token);
            if (!$slug) { jsonResponse(['error' => 'Invalid or revoked share link'], 403); break; }
            $payload = buildResponsesPayload($slug, true);
            if (!$payload) { jsonResponse(['error' => 'Survey not found'], 404); break; }
            jsonResponse($payload);
            break;

        case 'get_share_token':
            requireAdmin();
            $slug = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['slug'] ?? ''));
            if (!isValidSlug($slug)) { jsonResponse(['error' => 'Invalid slug'], 400); break; }
            $stmt = getDB()->prepare('SELECT share_token, created_at FROM survey_share_tokens WHERE survey_slug = ?');
            $stmt->execute([$slug]);
            $row = $stmt->fetch();
            jsonResponse([
                'token'      => $row ? $row['share_token'] : null,
                'created_at' => $row ? $row['created_at']  : null,
                'url'        => $row ? buildShareUrl($slug, $row['share_token']) : null,
            ]);
            break;

        case 'create_share_token':
            requireAdmin();
            $data = getInput();
            $slug = preg_replace('/[^a-z0-9-]/', '', strtolower($data['slug'] ?? ''));
            if (!isValidSlug($slug)) { jsonResponse(['error' => 'Invalid slug'], 400); break; }
            $token = bin2hex(random_bytes(32));
            $db = getDB();
            $db->prepare(
                'INSERT INTO survey_share_tokens (survey_slug, share_token, created_by)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE share_token = VALUES(share_token), created_by = VALUES(created_by), created_at = CURRENT_TIMESTAMP'
            )->execute([$slug, $token, (int)$_SESSION['user_id']]);
            jsonResponse([
                'token' => $token,
                'url'   => buildShareUrl($slug, $token),
            ]);
            break;

        case 'delete_share_token':
            requireAdmin();
            $data = getInput();
            $slug = preg_replace('/[^a-z0-9-]/', '', strtolower($data['slug'] ?? ''));
            if (!isValidSlug($slug)) { jsonResponse(['error' => 'Invalid slug'], 400); break; }
            getDB()->prepare('DELETE FROM survey_share_tokens WHERE survey_slug = ?')->execute([$slug]);
            jsonResponse(['ok' => true]);
            break;

        case 'get_ai_summaries':
            // Admin OR public share-token holder may read cached summaries.
            $slug      = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['slug'] ?? ''));
            $shareTok  = trim($_GET['token'] ?? '');
            $okAccess  = isAdmin() || ($shareTok && resolveShareToken($shareTok) === $slug);
            if (!$okAccess) { jsonResponse(['error' => 'Unauthorized'], 403); break; }
            if (!isValidSlug($slug)) { jsonResponse(['error' => 'Invalid slug'], 400); break; }
            $stmt = getDB()->prepare(
                'SELECT question_key, summary_md, response_count, generated_at
                 FROM ai_summaries WHERE survey_slug = ?'
            );
            $stmt->execute([$slug]);
            $out = [];
            foreach ($stmt->fetchAll() as $row) {
                $out[$row['question_key']] = [
                    'summary_md'     => $row['summary_md'],
                    'response_count' => (int)$row['response_count'],
                    'generated_at'   => $row['generated_at'],
                ];
            }
            jsonResponse($out);
            break;

        case 'generate_ai_summary':
            $data     = getInput();
            $slug     = preg_replace('/[^a-z0-9-]/', '', strtolower($data['slug'] ?? ''));
            $qKey     = trim($data['question_key'] ?? '');
            $shareTok = trim($data['token'] ?? '');

            // Auth: admin OR a valid share token for this slug.
            $authorized = isAdmin() || ($shareTok !== '' && resolveShareToken($shareTok) === $slug);
            if (!$authorized) { jsonResponse(['error' => 'Unauthorized'], 403); break; }

            if (!isValidSlug($slug)) { jsonResponse(['error' => 'Invalid slug'], 400); break; }
            if ($qKey === '' || strlen($qKey) > 120) { jsonResponse(['error' => 'Invalid question_key'], 400); break; }

            // Per-session throttle: 10s between any two summaries from the same browser.
            $now = time();
            if (!empty($_SESSION['ai_summary_last_at']) && ($now - (int)$_SESSION['ai_summary_last_at']) < 10) {
                jsonResponse(['error' => 'Please wait a few seconds between summaries.'], 429);
                break;
            }
            // Global throttle: 30s between regenerates of the same question, across all callers.
            $tStmt = getDB()->prepare(
                'SELECT generated_at FROM ai_summaries WHERE survey_slug = ? AND question_key = ?'
            );
            $tStmt->execute([$slug, $qKey]);
            $existing = $tStmt->fetch();
            if ($existing && (time() - strtotime($existing['generated_at'])) < 30) {
                jsonResponse(['error' => 'A summary for this question was just generated. Try again in a moment.'], 429);
                break;
            }

            $survey = loadSurvey($slug);
            if (!$survey) { jsonResponse(['error' => 'Survey not found'], 404); break; }

            // Whitelist: only free-text question types may be summarised.
            $flat = flattenQuestions(sanitizeSurveyForClient($survey)['questions']);
            $qDef = null;
            foreach ($flat as $q) { if ($q['key'] === $qKey) { $qDef = $q; break; } }
            if (!$qDef) { jsonResponse(['error' => 'Question not found'], 404); break; }
            if (!in_array($qDef['type'], ['text', 'textarea'], true)) {
                jsonResponse(['error' => 'Only free-text questions can be summarised.'], 400);
                break;
            }

            // Pull all non-empty answers.
            $db = getDB();
            $stmt = $db->prepare(
                'SELECT a.answer_value
                 FROM survey_answers a
                 JOIN survey_sessions s ON s.id = a.session_id
                 WHERE s.survey_slug = ? AND a.question_key = ? AND TRIM(a.answer_value) <> ""'
            );
            $stmt->execute([$slug, $qKey]);
            $answers = array_map(fn($r) => trim((string)$r['answer_value']), $stmt->fetchAll());
            $answers = array_values(array_filter($answers, fn($s) => $s !== ''));
            if (count($answers) < 2) {
                jsonResponse(['error' => 'Need at least 2 responses to generate a summary.'], 400);
                break;
            }

            $system = "You are an experienced UX researcher running an affinity-mapping exercise. Read all the survey responses provided and group them into 3–7 themes that capture the patterns. Respond in markdown with this structure:\n\n## Themes\n\nFor each theme, use a level-3 heading with a short title and an approximate count in parens, then a 1–2 sentence description of the theme, then a blockquote with one or two of the most representative verbatim quotes.\n\n## Notable outliers\n\nA short bullet list of any responses that didn't fit the main themes — keep this brief.\n\nKeep the whole summary under 500 words. Don't editorialise or invent quotes — every quoted line must appear verbatim in the input.";

            $numbered = [];
            foreach ($answers as $i => $a) {
                $numbered[] = ($i + 1) . '. ' . $a;
            }
            $user = "Survey question: " . $qDef['label'] . "\n\nResponses (" . count($answers) . " total):\n\n" . implode("\n\n", $numbered);

            try {
                $summary = callOpenAI($system, $user);
            } catch (Throwable $e) {
                error_log('generate_ai_summary failed: ' . $e->getMessage());
                // Admins see the real upstream error to make debugging
                // possible; share-token callers see only the generic message.
                $msg = isAdmin()
                    ? 'AI error: ' . $e->getMessage()
                    : 'AI service unavailable. Try again shortly.';
                jsonResponse(['error' => $msg], 502);
                break;
            }

            // generated_by = 0 indicates a share-token caller (no admin user_id).
            $db->prepare(
                'INSERT INTO ai_summaries (survey_slug, question_key, summary_md, response_count, generated_by)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE summary_md = VALUES(summary_md), response_count = VALUES(response_count),
                                         generated_by = VALUES(generated_by), generated_at = CURRENT_TIMESTAMP'
            )->execute([$slug, $qKey, $summary, count($answers), (int)($_SESSION['user_id'] ?? 0)]);

            $_SESSION['ai_summary_last_at'] = $now;

            jsonResponse([
                'summary_md'     => $summary,
                'response_count' => count($answers),
                'generated_at'   => date('Y-m-d H:i:s'),
            ]);
            break;

        case 'export_csv':
            $slug      = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['slug'] ?? ''));
            $shareTok  = trim($_GET['token'] ?? '');
            $isAdminU  = isAdmin();
            $okShare   = $shareTok !== '' && resolveShareToken($shareTok) === $slug;
            if (!$isAdminU && !$okShare) { jsonResponse(['error' => 'Unauthorized'], 403); break; }
            // Share-token exports omit the session token and IP columns to
            // match the data the share view shows on screen.
            $stripPII  = !$isAdminU;

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

            while (ob_get_level()) ob_end_clean();
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $slug . '-responses.csv"');
            header('Cache-Control: no-cache');

            $fh = fopen('php://output', 'w');
            fwrite($fh, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel

            // Header row
            $headerRow = $stripPII
                ? ['Started', 'Completed']
                : ['Session', 'Started', 'Completed', 'IP'];
            foreach ($questions as $q) { $headerRow[] = $q['label']; }
            fputcsv($fh, $headerRow);

            foreach ($rows as $row) {
                $line = $stripPII
                    ? [$row['created_at'], $row['completed_at'] ?? '']
                    : [
                        substr($row['session_token'], 0, 8),
                        $row['created_at'],
                        $row['completed_at'] ?? '',
                        $row['ip_address'],
                    ];
                foreach ($questions as $qDef) {
                    $key     = $qDef['key'];
                    $val     = $answerMap[$row['id']][$key] ?? '';
                    $decoded = json_decode($val, true);
                    if (is_array($decoded)) {
                        $sep = ($qDef['type'] ?? '') === 'ranking' ? ' > ' : ', ';
                        $line[] = implode($sep, $decoded);
                    } else {
                        $line[] = $val;
                    }
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

        case 'delete_sessions':
            requireAdmin();
            $data   = getInput();
            $slug   = preg_replace('/[^a-z0-9-]/', '', strtolower($data['slug'] ?? ''));
            $tokens = $data['tokens'] ?? [];

            if (!isValidSlug($slug)) { jsonResponse(['error' => 'Invalid slug'], 400); break; }
            if (!is_array($tokens) || !$tokens) { jsonResponse(['error' => 'No sessions selected'], 400); break; }

            $clean = [];
            foreach ($tokens as $t) {
                $t = is_string($t) ? trim($t) : '';
                if (strlen($t) === 64 && ctype_xdigit($t)) $clean[] = $t;
            }
            if (!$clean) { jsonResponse(['error' => 'No valid session tokens'], 400); break; }

            $placeholders = implode(',', array_fill(0, count($clean), '?'));
            $db   = getDB();
            $stmt = $db->prepare(
                "DELETE FROM survey_sessions WHERE survey_slug = ? AND session_token IN ($placeholders)"
            );
            $stmt->execute(array_merge([$slug], $clean));
            $deleted = $stmt->rowCount();

            jsonResponse(['ok' => true, 'deleted' => $deleted]);
            break;

        default:
            jsonResponse(['error' => 'Unknown action'], 404);
    }
} catch (Throwable $e) {
    jsonResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
}
