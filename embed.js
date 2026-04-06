document.addEventListener('DOMContentLoaded', function() {
  var iframe = document.createElement('iframe');
  iframe.src = 'https://eugen-widget.vercel.app/index.html';
  iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:100px;height:100px;border:none;z-index:999999;background:transparent;';
  iframe.setAttribute('allowtransparency', 'true');
  iframe.id = 'eugen-chat-widget';
  document.body.appendChild(iframe);
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'eugen-chat-resize') {
      iframe.style.width = e.data.width + 'px';
      iframe.style.height = e.data.height + 'px';
    }
  });
});
