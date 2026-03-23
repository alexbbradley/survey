<?php
require_once __DIR__ . '/config.php';
$slug = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['s'] ?? ''));
$view = $_GET['view'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= htmlspecialchars(APP_NAME) ?></title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="icon" type="image/png" href="favicon.png">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <?php if (APP_ENV === 'production'): ?>
    <link rel="stylesheet" href="dist/bundle.css">
  <?php endif; ?>
</head>

<body>
  <div id="app">
    <div class="flex items-center justify-center h-screen text-lg text-[#909090]">Loading…</div>
  </div>

  <!-- Modal overlay -->
  <div id="modal-overlay"
    class="hidden fixed inset-0 bg-black/45 z-[500] p-5 items-center justify-center"
    role="dialog" aria-modal="true">
    <div class="bg-[#222222] rounded-xl w-full max-w-[460px] shadow-2xl overflow-y-auto max-h-[90vh]">
      <div id="modal-content"></div>
    </div>
  </div>

  <!-- Toast notifications -->
  <div id="toast-container" class="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-none"></div>

  <script>
    window.SURVEY_SLUG = <?= json_encode($slug ?: null) ?>;
    window.SURVEY_VIEW = <?= json_encode($view ?: null) ?>;
  </script>

  <?php if (APP_ENV === 'development'): ?>
    <script src="http://localhost:<?= WEBPACK_DEV_PORT ?>/survey/bundle.js"></script>
  <?php else: ?>
    <script src="dist/bundle.js"></script>
  <?php endif; ?>
</body>

</html>
