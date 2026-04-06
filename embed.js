(function() {
  'use strict';

  // Prevent duplicate initialization (SPA route changes, double script tags)
  if (window.__eugenWidgetLoaded) return;
  window.__eugenWidgetLoaded = true;

  var WIDGET_ORIGIN = 'https://eugen-widget.vercel.app';
  var WIDGET_URL = WIDGET_ORIGIN + '/index.html';
  var IFRAME_ID = 'eugen-chat-widget';

  // Size limits
  var MIN_SIZE = 60;
  var MAX_WIDTH = 800;
  var MAX_HEIGHT = 1200;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(Number(val) || 0, max));
  }

  function init() {
    // Remove any existing widget (e.g. hot-reload)
    var existing = document.getElementById(IFRAME_ID);
    if (existing) existing.remove();

    var iframe = document.createElement('iframe');
    iframe.src = WIDGET_URL;
    iframe.id = IFRAME_ID;
    iframe.title = 'eugen! Chat-Widget';
    iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:100px;height:100px;border:none;z-index:999999;background:transparent;max-width:100vw;max-height:100vh;';
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    iframe.setAttribute('allow', 'clipboard-write');
    iframe.setAttribute('loading', 'lazy');

    // Error handling: hide iframe if it fails to load
    var loaded = false;
    iframe.addEventListener('load', function() { loaded = true; });
    iframe.addEventListener('error', function() { iframe.style.display = 'none'; });
    setTimeout(function() {
      if (!loaded) iframe.style.display = 'none';
    }, 15000);

    document.body.appendChild(iframe);

    // Message handler with origin validation
    function onMessage(e) {
      if (e.origin !== WIDGET_ORIGIN) return;
      if (!e.data || e.data.type !== 'eugen-chat-resize') return;

      var vw = window.innerWidth || document.documentElement.clientWidth;
      var vh = window.innerHeight || document.documentElement.clientHeight;

      var w = clamp(e.data.width, MIN_SIZE, Math.min(MAX_WIDTH, vw));
      var h = clamp(e.data.height, MIN_SIZE, Math.min(MAX_HEIGHT, vh));

      iframe.style.width = w + 'px';
      iframe.style.height = h + 'px';
    }

    window.addEventListener('message', onMessage);

    // Expose destroy API for SPAs
    window.EugenWidget = {
      destroy: function() {
        window.removeEventListener('message', onMessage);
        var el = document.getElementById(IFRAME_ID);
        if (el) el.remove();
        window.__eugenWidgetLoaded = false;
        delete window.EugenWidget;
      }
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
