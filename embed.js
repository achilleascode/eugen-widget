document.addEventListener('DOMContentLoaded', function () {
  // Sprache der Host-Seite erkennen (eugen.immo nutzt WPML) und ans Widget weitergeben.
  // Der iframe (Vercel) ist cross-origin und kann die Parent-Sprache NICHT selbst lesen,
  // daher wird sie hier als ?lang=-Parameter in die iframe-URL übergeben.
  function detectLang() {
    try {
      var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      if (htmlLang.indexOf('en') === 0) return 'en';
      if (htmlLang.indexOf('de') === 0) return 'de';
      // Fallback: WPML-Pfadpraefix /en/
      if (/^\/en(\/|$)/i.test(location.pathname)) return 'en';
      return 'de';
    } catch (e) {
      return 'de';
    }
  }
  var lang = detectLang();

  // Kritische Layout-Properties mit !important, damit globales Host-CSS
  // (WordPress-Themes setzen oft `iframe { max-width:100%; height:auto }`)
  // den Widget-iframe NICHT verformen oder abschneiden kann.
  var style = document.createElement('style');
  style.textContent = [
    '#eugen-chat-widget {',
    '  position: fixed !important;',
    '  bottom: 20px !important;',
    '  right: 20px !important;',
    '  top: auto !important;',
    '  left: auto !important;',
    '  width: 120px !important;',
    '  height: 120px !important;',
    '  max-width: none !important;',
    '  max-height: none !important;',
    '  min-width: 0 !important;',
    '  min-height: 0 !important;',
    '  margin: 0 !important;',
    '  padding: 0 !important;',
    '  border: 0 !important;',
    '  border-radius: 0 !important;',
    '  box-shadow: none !important;',
    '  clip-path: none !important;',
    '  transform: none !important;',
    '  z-index: 2147483647 !important;',
    '  background: transparent !important;',
    '  transition: bottom 0.25s ease, right 0.25s ease, width 0.25s ease, height 0.25s ease;',
    '}',
    '@media (max-width: 480px) {',
    '  #eugen-chat-widget {',
    '    bottom: 90px !important;',
    '    right: max(12px, env(safe-area-inset-right)) !important;',
    '  }',
    '}',
    '#eugen-chat-widget.eugen-open-mobile {',
    '  bottom: 0 !important;',
    '  right: 0 !important;',
    '  width: 100vw !important;',
    '  height: 100vh !important;',
    '  height: 100dvh !important;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var iframe = document.createElement('iframe');
  iframe.src = 'https://eugen-widget.vercel.app/index.html?lang=' + lang;
  iframe.id = 'eugen-chat-widget';
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('title', lang === 'en' ? 'eugen! chat' : 'eugen! Chat');
  document.body.appendChild(iframe);

  var savedScrollY = 0;
  var locked = false;

  function lockBodyScroll() {
    if (locked) return;
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    var b = document.body.style;
    b.position = 'fixed';
    b.top = '-' + savedScrollY + 'px';
    b.left = '0';
    b.right = '0';
    b.width = '100%';
    b.overflow = 'hidden';
    locked = true;
  }

  function unlockBodyScroll() {
    if (!locked) return;
    var b = document.body.style;
    b.position = '';
    b.top = '';
    b.left = '';
    b.right = '';
    b.width = '';
    b.overflow = '';
    window.scrollTo(0, savedScrollY);
    locked = false;
  }

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'eugen-chat-resize') return;
    var isMobile = window.innerWidth <= 480;
    var isOpen = !!e.data.isOpen;

    if (isOpen && isMobile) {
      iframe.classList.add('eugen-open-mobile');
      iframe.style.width = '';
      iframe.style.height = '';
      lockBodyScroll();
    } else {
      iframe.classList.remove('eugen-open-mobile');
      unlockBodyScroll();
      // Inline mit !important, damit es das collapsed-CSS (width/height !important,
      // das gegen Host-Theme-CSS schuetzt) beim Oeffnen/Bubble ueberschreiben kann.
      iframe.style.setProperty('width', e.data.width + 'px', 'important');
      iframe.style.setProperty('height', e.data.height + 'px', 'important');
    }
  });
});
