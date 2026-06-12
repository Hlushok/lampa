(function () {
  'use strict';

  if (window.__lampauaPwaInstallStarted) return;
  window.__lampauaPwaInstallStarted = true;

  var deferredPrompt = null;
  var button = null;

  function isInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  function isTv() {
    return /web0s|webos|tizen|smart-?tv|netcast|hbbtv/i.test(navigator.userAgent);
  }

  function canInstallPwa() {
    return window.isSecureContext && location.protocol !== 'file:';
  }

  function addStyles() {
    if (document.getElementById('lampaua-pwa-install-style')) return;

    var style = document.createElement('style');
    style.id = 'lampaua-pwa-install-style';
    style.textContent =
      '.lampaua-pwa-install{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:100000;padding:11px 16px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:#176dcc;color:#fff;font:600 14px/1.2 Arial,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.42);cursor:pointer}' +
      '.lampaua-pwa-install:hover,.lampaua-pwa-install:focus{background:#2384ed;outline:2px solid rgba(255,216,0,.8);outline-offset:2px}' +
      '.lampaua-pwa-install[hidden]{display:none!important}';
    document.head.appendChild(style);
  }

  function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        hideButton();
      });
      return;
    }

    hideButton();
  }

  function showButton() {
    if (isInstalled() || isTv()) return;

    if (!button) {
      addStyles();
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'lampaua-pwa-install';
      button.textContent = 'Встановити LampaUa';
      button.addEventListener('click', install);
      document.body.appendChild(button);
    }

    button.hidden = false;
  }

  function hideButton() {
    if (button) button.hidden = true;
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    showButton();
  });

  window.addEventListener('appinstalled', hideButton);

  if ('serviceWorker' in navigator && canInstallPwa()) {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .catch(function (error) {
        console.warn('LampaUa PWA service worker registration failed:', error);
      });
  }

})();
