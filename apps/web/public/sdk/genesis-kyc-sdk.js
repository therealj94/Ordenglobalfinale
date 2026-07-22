/**
 * GENESIS ID — KYC SDK (vanilla JS, framework-agnostic)
 *
 * Drop this file into any web app (React, Vue, plain HTML, PHP, etc.) to
 * launch the GENESIS ID facial + document verification flow in a modal,
 * and receive the result via callback. No build step required.
 *
 * Usage:
 *   <script src="https://genesis-id.orden-global.com/sdk/genesis-kyc-sdk.js"></script>
 *   <script>
 *     GenesisKYC.verify({
 *       userId: 'the-genesis-id-user-uuid',
 *       appName: 'veta-wallet',
 *       // The onboarding token returned by POST /auth/register (or an
 *       // access token, if this user already has a session). Required
 *       // unless the browser already holds a GENESIS ID session for this
 *       // user — an embedding app has its own login, not genesisid.online's,
 *       // so without this the embedded page has no way to authenticate the
 *       // KYC submission.
 *       onboardingToken: 'the-jwt-from-register-or-login',
 *       onComplete: function (result) {
 *         // result = { status: 'approved' | 'pending' | 'rejected', verificationId }
 *       },
 *       onError: function (err) { console.error(err); }
 *     });
 *   </script>
 *
 * IMPORTANT: This SDK only triggers the UI and reports what the user saw.
 * Your backend must independently confirm verification status server-to-server
 * using your app's API key before granting access — see server-examples/.
 */
(function (window) {
  'use strict';

  var DEFAULT_BASE_URL = 'https://genesis-id.orden-global.com';

  var config = {
    baseUrl: (window.GENESIS_KYC_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
  };

  function createOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'genesis-kyc-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2147483000',
      'background:rgba(15,23,42,0.85)', 'display:flex',
      'align-items:center', 'justify-content:center', 'padding:16px'
    ].join(';');

    var container = document.createElement('div');
    container.style.cssText = [
      'position:relative', 'width:100%', 'max-width:640px', 'height:90vh',
      'max-height:850px', 'background:#0f172a', 'border-radius:16px',
      'overflow:hidden', 'box-shadow:0 25px 50px rgba(0,0,0,0.5)'
    ].join(';');

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close verification');
    closeBtn.style.cssText = [
      'position:absolute', 'top:12px', 'right:12px', 'z-index:10',
      'width:36px', 'height:36px', 'border-radius:50%', 'border:none',
      'background:rgba(255,255,255,0.15)', 'color:#fff', 'font-size:22px',
      'line-height:1', 'cursor:pointer'
    ].join(';');

    var iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:0;';
    iframe.setAttribute('allow', 'camera; microphone');

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);

    return { overlay: overlay, iframe: iframe, closeBtn: closeBtn };
  }

  function verify(options) {
    options = options || {};
    var userId = options.userId;
    var appName = options.appName;
    var onboardingToken = options.onboardingToken;
    var onComplete = options.onComplete || function () {};
    var onError = options.onError || function () {};
    var baseUrl = options.baseUrl || config.baseUrl;

    if (!userId || !appName) {
      onError(new Error('GenesisKYC.verify requires both userId and appName'));
      return;
    }

    var ui = createOverlay();
    var url = baseUrl + '/embed/verify?userId=' + encodeURIComponent(userId) +
      '&appName=' + encodeURIComponent(appName) +
      (onboardingToken ? '&onboardingToken=' + encodeURIComponent(onboardingToken) : '');

    ui.iframe.src = url;
    document.body.appendChild(ui.overlay);
    document.body.style.overflow = 'hidden';

    function cleanup() {
      window.removeEventListener('message', handleMessage);
      if (ui.overlay.parentNode) ui.overlay.parentNode.removeChild(ui.overlay);
      document.body.style.overflow = '';
    }

    function handleMessage(event) {
      var data = event.data;
      if (!data || data.source !== 'genesis-kyc-sdk') return;

      if (data.event === 'status') {
        onComplete({ status: data.status, verificationId: data.verificationId });
        cleanup();
      }
    }

    ui.closeBtn.addEventListener('click', function () {
      cleanup();
      onError(new Error('User closed the verification window'));
    });

    window.addEventListener('message', handleMessage);
  }

  /**
   * Opens the verification flow as a full-page redirect instead of a modal.
   * Useful for mobile web where iframes + camera permissions can be finicky.
   * On completion, GENESIS ID redirects the browser back to `returnUrl` with
   * ?status=...&verificationId=... appended.
   */
  function verifyRedirect(options) {
    options = options || {};
    var userId = options.userId;
    var appName = options.appName;
    var onboardingToken = options.onboardingToken;
    var returnUrl = options.returnUrl || window.location.href;
    var baseUrl = options.baseUrl || config.baseUrl;

    if (!userId || !appName) {
      throw new Error('GenesisKYC.verifyRedirect requires userId and appName');
    }

    var url = baseUrl + '/embed/verify?userId=' + encodeURIComponent(userId) +
      '&appName=' + encodeURIComponent(appName) +
      '&returnUrl=' + encodeURIComponent(returnUrl) +
      (onboardingToken ? '&onboardingToken=' + encodeURIComponent(onboardingToken) : '');

    window.location.href = url;
  }

  window.GenesisKYC = {
    configure: function (opts) {
      if (opts && opts.baseUrl) config.baseUrl = opts.baseUrl.replace(/\/$/, '');
    },
    verify: verify,
    verifyRedirect: verifyRedirect
  };
})(window);
