<?php
require_once dirname(__DIR__) . '/config.php';

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        runMigrations($pdo);
    }
    return $pdo;
}

function runMigrations(PDO $pdo): void {
    static $ran = false;
    if ($ran) return;
    $ran = true;

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS survey_share_tokens (
            id           INT PRIMARY KEY AUTO_INCREMENT,
            survey_slug  VARCHAR(60) NOT NULL,
            share_token  CHAR(64) NOT NULL,
            created_by   INT NOT NULL,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_share_slug (survey_slug),
            UNIQUE KEY uk_share_token (share_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS ai_summaries (
            id              INT PRIMARY KEY AUTO_INCREMENT,
            survey_slug     VARCHAR(60) NOT NULL,
            question_key    VARCHAR(120) NOT NULL,
            summary_md      MEDIUMTEXT NOT NULL,
            response_count  INT NOT NULL,
            generated_by    INT NOT NULL,
            generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_summary (survey_slug, question_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}
