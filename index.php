<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';
$slug = preg_replace('/[^a-z0-9-]/', '', strtolower($_GET['s'] ?? ''));
$view = $_GET['view'] ?? '';
$survey = $slug ? loadSurvey($slug) : null;
$pageTitle = $survey ? $survey['title'] : APP_NAME;
$pageDesc  = $survey ? trim(explode("\n", $survey['description'] ?? '')[0]) : '';
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= htmlspecialchars($pageTitle) ?></title>
  <?php if ($pageDesc): ?>
    <meta name="description" content="<?= htmlspecialchars($pageDesc) ?>">
  <?php endif; ?>
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="icon" type="image/png" href="favicon.png">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <?php if (APP_ENV === 'production'): ?>
    <?php $cssVer = @filemtime(__DIR__ . '/dist/bundle.css') ?: time(); ?>
    <link rel="stylesheet" href="dist/bundle.css?v=<?= $cssVer ?>">
  <?php endif; ?>
</head>

<body>
  <div id="app">
    <div class="flex items-center justify-center h-screen text-lg text-[#fff]">Loading…</div>
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

    // Safety net: if the bundle fails to load, parse, or mount, show an actionable
    // error card so the user isn't stuck on "Loading…". Cleared by the app on mount.
    (function () {
      function showFallback(detail) {
        if (window.__APP_MOUNTED || window.__shownError) return;
        window.__shownError = true;
        var app = document.getElementById('app');
        if (!app) return;
        app.innerHTML =
          '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1a1a1a;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">' +
            '<div style="max-width:420px;width:100%;background:#222;border:1px solid #383838;border-radius:12px;padding:28px;text-align:center;color:#fffbf5;">' +
              '<h1 style="font-size:18px;font-weight:600;margin:0 0 8px;">Something went wrong</h1>' +
              '<p style="font-size:14px;color:#909090;margin:0 0 20px;line-height:1.5;">We couldn\'t load the survey. Please check your connection and try again.</p>' +
              '<button onclick="location.reload()" style="background:#b8ff5c;color:#1a1a1a;border:0;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;">Reload</button>' +
              (detail ? '<p style="font-size:11px;color:#606060;margin:16px 0 0;word-break:break-word;">' + String(detail).replace(/[<>&]/g, '') + '</p>' : '') +
            '</div>' +
          '</div>';
      }
      window.__loadGuard = setTimeout(function () { showFallback(null); }, 12000);
      window.addEventListener('error', function (e) {
        showFallback(e && e.message ? e.message : 'Script error');
      });
      window.addEventListener('unhandledrejection', function (e) {
        var msg = e && e.reason ? (e.reason.message || e.reason) : 'Unhandled error';
        showFallback(msg);
      });
    })();
  </script>

  <?php if (APP_ENV === 'development'): ?>
    <script src="http://localhost:<?= WEBPACK_DEV_PORT ?>/survey/bundle.js"></script>
  <?php else: ?>
    <?php $jsVer = @filemtime(__DIR__ . '/dist/bundle.js') ?: time(); ?>
    <script src="dist/bundle.js?v=<?= $jsVer ?>"></script>
  <?php endif; ?>
</body>

</html>