<?php
/**
 * migrate.php — run once to add missing columns, then delete this file.
 */
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $hasCreatedBy = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'snags'
        AND COLUMN_NAME = 'created_by'")->fetchColumn();

    if (!$hasCreatedBy) {
        $pdo->exec("ALTER TABLE snags ADD COLUMN created_by VARCHAR(254) NULL DEFAULT NULL AFTER device");
        echo "<p>✓ Added <code>created_by</code> column to <code>snags</code>.</p>";
    } else {
        echo "<p>✓ <code>created_by</code> column already exists — nothing to do.</p>";
    }

    $hasTokenTable = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'snag_list_tokens'")->fetchColumn();

    if (!$hasTokenTable) {
        $pdo->exec("CREATE TABLE snag_list_tokens (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            list_id    INT NOT NULL,
            email      VARCHAR(254) NOT NULL,
            token      VARCHAR(64)  NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_list  (list_id),
            FOREIGN KEY (list_id) REFERENCES snag_lists(id) ON DELETE CASCADE
        ) ENGINE=InnoDB");
        echo "<p>✓ Created <code>snag_list_tokens</code> table.</p>";
    } else {
        echo "<p>✓ <code>snag_list_tokens</code> table already exists.</p>";
    }

    $hasCompleted = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'snags'
        AND COLUMN_NAME = 'completed'")->fetchColumn();

    if (!$hasCompleted) {
        $pdo->exec("ALTER TABLE snags ADD COLUMN completed TINYINT(1) NOT NULL DEFAULT 0 AFTER created_by");
        echo "<p>✓ Added <code>completed</code> column to <code>snags</code>.</p>";
    } else {
        echo "<p>✓ <code>completed</code> column already exists — nothing to do.</p>";
    }

    echo "<p><strong>Done. Delete this file now.</strong></p>";
} catch (PDOException $e) {
    echo "<p style='color:red'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
