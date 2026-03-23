<?php
/**
 * install.php — run this ONCE to create database tables and a default admin user.
 * Delete or protect this file after installation.
 */
require_once __DIR__ . '/config.php';

$errors = [];
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $adminEmail = trim($_POST['admin_email'] ?? '');
    $adminPass  = $_POST['admin_pass'] ?? '';
    $adminPass2 = $_POST['admin_pass2'] ?? '';

    if (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid admin email address is required.';
    if (strlen($adminPass) < 6)  $errors[] = 'Password must be at least 6 characters.';
    if ($adminPass !== $adminPass2) $errors[] = 'Passwords do not match.';

    if (empty($errors)) {
        try {
            // Connect without dbname first to create DB if needed
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET,
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `" . DB_NAME . "`");

            // ── Drop old Gantt tables (if migrating from Gantt app) ────
            $pdo->exec("DROP TABLE IF EXISTS tasks");
            $pdo->exec("DROP TABLE IF EXISTS charts");

            // ── users ─────────────────────────────────────────────────
            $pdo->exec("CREATE TABLE IF NOT EXISTS users (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                email         VARCHAR(254) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                is_admin      TINYINT(1)   NOT NULL DEFAULT 0,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            // Upgrade: rename username → email if the old column still exists
            $hasUsername = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
                AND COLUMN_NAME = 'username'")->fetchColumn();
            if ($hasUsername) {
                $pdo->exec("ALTER TABLE users CHANGE username email VARCHAR(254) NOT NULL");
            }

            // Upgrade: add is_admin column if missing
            $hasIsAdmin = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
                AND COLUMN_NAME = 'is_admin'")->fetchColumn();
            if (!$hasIsAdmin) {
                $pdo->exec("ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash");
            }

            // ── login_attempts ────────────────────────────────────────
            $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                ip           VARCHAR(45)  NOT NULL,
                email        VARCHAR(254) NOT NULL DEFAULT '',
                attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ip_time (ip, attempted_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            // Upgrade: rename username → email in login_attempts
            $hasUname = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_attempts'
                AND COLUMN_NAME = 'username'")->fetchColumn();
            if ($hasUname) {
                $pdo->exec("ALTER TABLE login_attempts CHANGE username email VARCHAR(254) NOT NULL DEFAULT ''");
            }

            // ── password_resets ───────────────────────────────────────
            $pdo->exec("CREATE TABLE IF NOT EXISTS password_resets (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                user_id    INT          NOT NULL,
                token      VARCHAR(64)  NOT NULL UNIQUE,
                expires_at DATETIME     NOT NULL,
                created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (token),
                INDEX idx_user  (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            // ── survey_sessions ───────────────────────────────────────
            $pdo->exec("CREATE TABLE IF NOT EXISTS survey_sessions (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                survey_slug      VARCHAR(60)  NOT NULL,
                session_token    VARCHAR(64)  NOT NULL UNIQUE,
                user_id          INT          NULL DEFAULT NULL,
                ip_address       VARCHAR(45)  NOT NULL DEFAULT '',
                user_agent       TEXT,
                current_question INT          NOT NULL DEFAULT 0,
                completed_at     TIMESTAMP    NULL DEFAULT NULL,
                created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_slug  (survey_slug),
                INDEX idx_token (session_token),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            // ── survey_answers ────────────────────────────────────────
            $pdo->exec("CREATE TABLE IF NOT EXISTS survey_answers (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                session_id    INT          NOT NULL,
                question_key  VARCHAR(100) NOT NULL,
                answer_value  MEDIUMTEXT,
                answered_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_session_question (session_id, question_key),
                FOREIGN KEY (session_id) REFERENCES survey_sessions(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            // ── Admin account ─────────────────────────────────────────
            $hash = password_hash($adminPass, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)
                ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), is_admin = 1");
            $stmt->execute([$adminEmail, $hash]);

            $success = true;
            @unlink(__FILE__);
        } catch (PDOException $e) {
            $errors[] = 'Database error: ' . htmlspecialchars($e->getMessage());
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Survey App — Install</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 500px; margin: 60px auto; padding: 0 20px; color: #333; }
  h1 { margin-bottom: 8px; }
  .subtitle { color: #666; margin-bottom: 28px; }
  label { display: block; font-weight: 600; margin-top: 16px; margin-bottom: 4px; }
  input { width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; box-sizing: border-box; }
  button { margin-top: 24px; width: 100%; padding: 10px; background: #4A90E2; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
  button:hover { background: #357abd; }
  .error { background: #fee; border: 1px solid #fcc; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; color: #c00; }
  .success { background: #efe; border: 1px solid #cfc; border-radius: 6px; padding: 14px; color: #060; }
  .success a { color: #060; font-weight: bold; }
</style>
</head>
<body>
<h1>Survey App — Installer</h1>
<p class="subtitle">Run this once to create the database and admin account. Delete this file afterwards.</p>

<?php if ($success): ?>
  <div class="success">
    <strong>Installation complete!</strong><br><br>
    Database and tables created. Admin account set up.<br><br>
    <a href="index.php">→ Go to the app</a><br><br>
    <em>Remember to delete or restrict access to install.php.</em>
  </div>
<?php else: ?>

<?php foreach ($errors as $e): ?>
  <div class="error"><?= htmlspecialchars($e) ?></div>
<?php endforeach; ?>

<form method="post">
  <label for="admin_email">Admin email address</label>
  <input type="email" id="admin_email" name="admin_email" value="<?= htmlspecialchars($_POST['admin_email'] ?? '') ?>" required placeholder="admin@example.com">

  <label for="admin_pass">Admin password</label>
  <input type="password" id="admin_pass" name="admin_pass" required minlength="6">

  <label for="admin_pass2">Confirm password</label>
  <input type="password" id="admin_pass2" name="admin_pass2" required>

  <button type="submit">Install</button>
</form>
<?php endif; ?>
</body>
</html>
