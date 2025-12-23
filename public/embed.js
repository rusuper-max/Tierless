/**
 * Tierless Embed Widget Loader
 *
 * Usage:
 * <div id="tierless-abc123"></div>
 * <script
 *   src="https://tierless.net/embed.js"
 *   data-tierless-page="abc123"
 *   data-tierless-container="tierless-abc123"
 *   data-tierless-theme="auto"
 *   data-tierless-badge="1"
 *   data-tierless-bg="inherit"
 *   data-tierless-radius="md"
 *   async
 * ></script>
 */
(function () {
  var BASE_URL = 'https://tierless.net';

  // Auto-resize listener for all Tierless iframes
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'tierless-resize') {
      var pageId = e.data.pageId;
      var height = e.data.height;

      // Find iframe by data attribute or by matching source
      var iframes = document.querySelectorAll('iframe[data-tierless-page="' + pageId + '"]');
      if (iframes.length > 0) {
        for (var i = 0; i < iframes.length; i++) {
          iframes[i].style.height = height + 'px';
        }
      } else {
        // Fallback: find by source window
        var allIframes = document.getElementsByTagName('iframe');
        for (var j = 0; j < allIframes.length; j++) {
          if (allIframes[j].contentWindow === e.source) {
            allIframes[j].style.height = height + 'px';
            break;
          }
        }
      }
    }
  });

  // Widget loader - finds script tags with data-tierless-page and creates iframes
  function initWidgets() {
    var scripts = document.querySelectorAll('script[data-tierless-page]');

    scripts.forEach(function (script) {
      var pageId = script.dataset.tierlessPage;
      if (!pageId) return;

      var containerId = script.dataset.tierlessContainer || ('tierless-' + pageId);
      var theme = script.dataset.tierlessTheme || 'auto';
      var badge = script.dataset.tierlessBadge !== '0';
      var bg = script.dataset.tierlessBg || 'inherit';
      var radius = script.dataset.tierlessRadius || 'md';

      var container = document.getElementById(containerId);
      if (!container) {
        console.warn('[Tierless] Container not found: #' + containerId);
        return;
      }

      // Prevent duplicate initialization
      if (container.dataset.tierlessInitialized === 'true') return;
      container.dataset.tierlessInitialized = 'true';

      // Build embed URL
      var params = [];
      if (theme !== 'auto') params.push('theme=' + encodeURIComponent(theme));
      if (!badge) params.push('badge=0');
      if (bg === 'transparent') params.push('bg=transparent');
      if (radius !== 'md') params.push('radius=' + encodeURIComponent(radius));

      var embedUrl = BASE_URL + '/p/' + encodeURIComponent(pageId) + '/embed';
      if (params.length > 0) embedUrl += '?' + params.join('&');

      // Radius CSS value
      var radiusPx = radius === '0' ? '0' :
                     radius === 'sm' ? '8px' :
                     radius === 'md' ? '12px' :
                     radius === 'lg' ? '16px' :
                     radius === 'xl' ? '24px' : '12px';

      // Create iframe
      var iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.setAttribute('data-tierless-page', pageId);
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allowtransparency', 'true');
      iframe.style.cssText = 'width:100%;min-height:400px;border:none;border-radius:' + radiusPx + ';display:block;';

      if (bg === 'transparent') {
        iframe.style.background = 'transparent';
      }

      container.appendChild(iframe);
    });
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }
})();
