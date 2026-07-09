function initEugenWidget() {
  // Doppelte Einbindung (z. B. Snippet in Header UND Footer) darf nicht zwei iframes erzeugen.
  if (document.getElementById('eugen-chat-widget')) return;

  // Sprache der Host-Seite erkennen (eugen.immo nutzt WPML) und ans Widget weitergeben.
  function detectLang() {
    try {
      var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
      if (htmlLang.indexOf('en') === 0) return 'en';
      if (htmlLang.indexOf('de') === 0) return 'de';
      if (/^\/en(\/|$)/i.test(location.pathname)) return 'en';
      return 'de';
    } catch (e) {
      return 'de';
    }
  }
  var lang = detectLang();

  // Der Trigger ist ein HALBKREIS-Tab, der buendig am RECHTEN Bildschirmrand klebt und
  // VERTIKAL EXAKT ZENTRIERT sitzt (top:50% + translateY(-50%)) — auf Desktop UND Mobil gleich.
  // Kritische Layout-Properties mit !important, damit Host-Theme-CSS (WordPress:
  // "iframe { height:auto; max-width:100% }") den iframe nicht verformt/abschneidet.
  var style = document.createElement('style');
  style.textContent = [
    '#eugen-chat-widget {',
    '  position: fixed !important;',
    '  top: 50% !important;',
    '  right: 0 !important;',
    '  bottom: auto !important;',
    '  left: auto !important;',
    '  transform: translateY(-50%) !important;',
    '  width: 64px !important;',
    '  height: 128px !important;',
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
    '  z-index: 2147483647 !important;',
    '  background: transparent !important;',
    '  transition: width 0.25s ease, height 0.25s ease, right 0.25s ease;',
    '}',
    '#eugen-chat-widget.eugen-open-mobile {',
    '  top: 0 !important;',
    '  right: 0 !important;',
    '  bottom: 0 !important;',
    '  left: auto !important;',
    '  transform: none !important;',
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
      iframe.style.removeProperty('width');
      iframe.style.removeProperty('height');
      iframe.style.removeProperty('right');
      lockBodyScroll();
    } else {
      iframe.classList.remove('eugen-open-mobile');
      unlockBodyScroll();
      // Inline mit !important, um das collapsed-CSS beim Oeffnen/Bubble zu ueberschreiben.
      iframe.style.setProperty('width', e.data.width + 'px', 'important');
      iframe.style.setProperty('height', e.data.height + 'px', 'important');
      // Der Halbkreis-Tab klebt IMMER buendig am rechten Rand (right:0), damit die flache
      // Kante genau am Bildschirmrand liegt (= halber Kreis). Nur der GEOEFFNETE Chat rueckt
      // mit Abstand ein. Im Bubble-Zustand waechst der iframe nach LINKS, Tab bleibt am Rand.
      iframe.style.setProperty('right', isOpen ? '16px' : '0px', 'important');
    }
  });
}

// Nicht blind an DOMContentLoaded haengen: Wird das Script async oder von einem Caching-Plugin
// (WP Rocket & Co.) nachgeladen, ist das Event laengst gefeuert und das Widget erschiene nie.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEugenWidget);
} else {
  initEugenWidget();
}
