/**
 * eugen! Chat Widget Embed Script
 * Brand color: #14E1A7 (Eugen Grün)
 *
 * Usage: Add this script to your website:
 * <script src="https://YOUR_DOMAIN/embed.js"></script>
 *
 * Or copy the code below directly into your HTML before </body>
 *
 * Dimensions:
 * - Closed: 100x100px (only the chat button)
 * - Open: 440x650px (chat window + button)
 */

(function() {
    // Configuration - Change this to your widget URL
    var WIDGET_URL = window.EUGEN_CHAT_URL || 'https://eugen-widget.vercel.app/index.html';

    // Dimensions: closed = 100x100 (button only), open = 440x650 (chat + button)
    var CLOSED_SIZE = { width: 100, height: 100 };

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.id = 'eugen-chat-widget';
    iframe.src = WIDGET_URL;
    iframe.style.cssText = [
        'position: fixed',
        'bottom: 0',
        'right: 0',
        'width: ' + CLOSED_SIZE.width + 'px',
        'height: ' + CLOSED_SIZE.height + 'px',
        'border: none',
        'background: transparent',
        'z-index: 2147483647',
        'transition: width 0.3s ease, height 0.3s ease',
        'pointer-events: auto'
    ].join(';');
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');

    // Parse the origin from the widget URL for secure postMessage validation
    var widgetOrigin;
    try {
        widgetOrigin = new URL(WIDGET_URL).origin;
    } catch (e) {
        widgetOrigin = null;
    }

    // Listen for resize messages from the widget (with origin check)
    window.addEventListener('message', function(event) {
        // Only accept messages from the widget's origin
        if (widgetOrigin && event.origin !== widgetOrigin) return;
        if (event.data && event.data.type === 'eugen-chat-resize') {
            // Sanitize dimensions to prevent abuse
            var width = Math.min(Math.max(parseInt(event.data.width, 10) || 100, 50), 600);
            var height = Math.min(Math.max(parseInt(event.data.height, 10) || 100, 50), 900);
            iframe.style.width = width + 'px';
            iframe.style.height = height + 'px';
        }
    });

    // Add iframe to page when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.appendChild(iframe);
        });
    } else {
        document.body.appendChild(iframe);
    }
})();
