document.addEventListener('DOMContentLoaded', function () {
  var style = document.createElement('style');
  style.textContent = [
    '#eugen-chat-widget {',
    '  position: fixed;',
    '  bottom: 20px;',
    '  right: 20px;',
    '  width: 100px;',
    '  height: 100px;',
    '  border: 0;',
    '  z-index: 999999;',
    '  background: transparent;',
    '  transition: bottom 0.25s ease, right 0.25s ease, width 0.25s ease, height 0.25s ease;',
    '}',
    '@media (max-width: 480px) {',
    '  #eugen-chat-widget {',
    '    bottom: 90px;',
    '    right: 12px;',
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
  iframe.src = 'https://eugen-widget.vercel.app/index.html';
  iframe.id = 'eugen-chat-widget';
  iframe.setAttribute('allowtransparency', 'true');
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
      iframe.style.width = e.data.width + 'px';
      iframe.style.height = e.data.height + 'px';
    }
  });
});
