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

  // EUGEN_BOX ist die EINZIGE Wahrheit für alle Pixelmaße der iframe-Box. Die vier Geometrie-
  // Konstanten beschreiben den Launcher, die collapsed-Box wird daraus gerechnet (siehe unten),
  // damit Kommentar und tatsächliche Maße nicht auseinanderlaufen können:
  //   LAUNCHER       Durchmesser des runden Trigger-Kreises in index.html.
  //   HALO           Luft rund um den Kreis für Pulse-Glow und Notification-Badge; deckt Blur
  //                  (max. 16 px) und Ring-Spread (max. 8 px) der pulseGlow-Animation ab.
  //   OVERHANG       So weit ragt der Kreis nach RECHTS über die iframe-Kante hinaus. Der
  //                  iframe sitzt mit right:0 auf dem Bildschirmrand, sein overflow:hidden
  //                  kappt den Überstand, wodurch der Kreis angeschnitten wirkt (sichtbar 46
  //                  von 56 px), ohne dass ein Element den Viewport verlässt.
  //   RESERVE_LINKS  Zusätzliche Luft links neben dem Halo. Nach links kostet Breite nichts,
  //                  weil der iframe dort nicht an den Bildschirmrand grenzt; der Glow läuft
  //                  dadurch vollständig aus statt an der iframe-Kante zu enden.
  // Die Werte müssen zu den Tokens (--eugen-launcher/--eugen-halo/--eugen-overhang) und zu
  // LEGACY_BOX in der Zustandsmeldung von index.html passen.
  var EUGEN_BOX = {
    LAUNCHER: 56,
    HALO: 20,
    OVERHANG: 10,
    RESERVE_LINKS: 10,
    open: { w: 400, h: 650 },
    expanded: { w: 620, h: 900 },
    MOBILE_MAX: 480
  };
  // Höhe: Kreis plus Halo oben und unten (96). Breite: Halo, Kreis ohne den gekappten
  // Überstand, plus Reserve links (76).
  EUGEN_BOX.collapsed = {
    w: EUGEN_BOX.HALO + EUGEN_BOX.LAUNCHER - EUGEN_BOX.OVERHANG + EUGEN_BOX.RESERVE_LINKS,
    h: EUGEN_BOX.LAUNCHER + 2 * EUGEN_BOX.HALO
  };
  // Die Bubble wächst ausschließlich nach links, ihre Höhe bleibt die der collapsed-Box.
  EUGEN_BOX.bubble = { w: 340, h: EUGEN_BOX.collapsed.h };
  EUGEN_BOX.bubbleMobile = { w: 260, h: EUGEN_BOX.collapsed.h };

  // Der Trigger ist ein RUNDER Kreis, der am RECHTEN Bildschirmrand leicht angeschnitten klebt
  // und VERTIKAL EXAKT ZENTRIERT sitzt (top:50% + translateY(-50%)), auf Desktop wie auf Mobil.
  // right bleibt in ALLEN Zuständen 0, damit der Anschnitt offen wie geschlossen identisch
  // aussieht; den Randabstand des geöffneten Panels macht dessen eigenes right:20px innerhalb
  // des iframes.
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
    '  width: ' + EUGEN_BOX.collapsed.w + 'px !important;',
    '  height: ' + EUGEN_BOX.collapsed.h + 'px !important;',
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
    '  transition: width 0.25s ease, height 0.25s ease;',
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
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  #eugen-chat-widget {',
    '    transition: none !important;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var iframe = document.createElement('iframe');
  iframe.src = 'https://eugen-widget.vercel.app/index.html?lang=' + lang;
  iframe.id = 'eugen-chat-widget';
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('title', lang === 'en' ? 'eugen! chat' : 'eugen! Chat');
  iframe.addEventListener('load', postHostState);
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

  // Das Widget im iframe kann NICHT selbst feststellen, ob der Nutzer mobil ist:
  // window.innerWidth ist dort die iframe-Breite (collapsed 76 px, also immer "mobil"), und
  // window.parent.innerWidth wirft cross-origin. Deshalb meldet der Host den Zustand aktiv, und
  // zwar beim Laden, bei jeder Box-Änderung, bei jedem Resize und auf Anfrage des Widgets
  // (eugen-request-host-state).
  function postHostState() {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: 'eugen-host-state',
      isMobile: window.innerWidth <= EUGEN_BOX.MOBILE_MAX
    }, '*');
  }

  // Zuletzt vom Widget gemeldeter Zustand, Grundlage für das Neu-Anwenden bei Resize.
  var lastState = { isOpen: false, showBubble: false, expanded: false };

  function applyBox(state) {
    lastState = state;
    var isMobile = window.innerWidth <= EUGEN_BOX.MOBILE_MAX;

    if (state.isOpen && isMobile) {
      // Vollbild macht die Klasse (100vw/100dvh); die Inline-Werte müssen weg, sonst gewinnen
      // sie mit !important gegen sie.
      iframe.classList.add('eugen-open-mobile');
      iframe.style.removeProperty('width');
      iframe.style.removeProperty('height');
      lockBodyScroll();
      postHostState();
      return;
    }

    iframe.classList.remove('eugen-open-mobile');
    unlockBodyScroll();

    var box;
    if (state.isOpen) {
      box = state.expanded ? EUGEN_BOX.expanded : EUGEN_BOX.open;
    } else if (state.showBubble) {
      box = isMobile ? EUGEN_BOX.bubbleMobile : EUGEN_BOX.bubble;
    } else {
      box = EUGEN_BOX.collapsed;
    }

    // Nie breiter/höher als der Viewport, sonst schiebt der iframe die Hostseite auf.
    var w = Math.min(box.w, window.innerWidth);
    var h = Math.min(box.h, window.innerHeight - 24);

    // Inline mit !important, um das collapsed-CSS beim Öffnen/Bubble zu überschreiben.
    iframe.style.setProperty('width', w + 'px', 'important');
    iframe.style.setProperty('height', h + 'px', 'important');
    postHostState();
  }

  window.addEventListener('message', function (e) {
    if (!e.data) return;

    // Pull: Das Widget fordert den Host-Zustand an, sobald sein eigener Listener steht. Nötig,
    // weil die Teaser-Bubble nach festem Timer erscheint und auf langsamen Verbindungen sonst
    // ohne body.host-mobile rendern könnte (nowrap statt kompakt).
    if (e.data.type === 'eugen-request-host-state') {
      postHostState();
      return;
    }

    if (e.data.type !== 'eugen-chat-resize') return;
    // expanded kann fehlen, wenn ein WordPress-Cache noch eine alte index.html ausliefert.
    // Dann aus der gemeldeten Legacy-Breite ableiten (expanded meldet 620, normal 400).
    var expanded = typeof e.data.expanded === 'boolean'
      ? e.data.expanded
      : (typeof e.data.width === 'number' && e.data.width >= 600);

    applyBox({
      isOpen: !!e.data.isOpen,
      showBubble: !!e.data.showBubble,
      expanded: expanded
    });
  });

  // Ohne dieses Neu-Anwenden bleibt nach einer Gerätedrehung im geöffneten Zustand die
  // Desktop-Box (400x650) auf Mobilbreite stehen: Das Widget meldet nur bei Zustandswechseln,
  // die Mobil-Entscheidung fällt aber hier im Host anhand von window.innerWidth.
  var resizeTimer = null;
  function onViewportChange() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = null;
      applyBox(lastState);
    }, 150);
  }
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);
}

// Nicht blind an DOMContentLoaded hängen: Wird das Script async oder von einem Caching-Plugin
// (WP Rocket & Co.) nachgeladen, ist das Event längst gefeuert und das Widget erschiene nie.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEugenWidget);
} else {
  initEugenWidget();
}
