;(function() {
  
  let $ = document.querySelectorAll.bind(document);
  
  let confirmMessage = 'App updated. Reload now?';
  let updateNode = $('.app-pwa-message')[0];
  let message = {
    downloading: 'Downloading updates...',
    updating: 'Applying updates..,',
    success: 'App updated. Reload to apply changess.',
    offline: 'No internet.',
    online: 'Connected to internet',
    upToDate: 'No updates.',
  };
  
  let checkVersionTimeout = window.setTimeout(function() {
    updateNode.textContent = message.upToDate;
    checkVersionTimeout = window.setTimeout(function() {
      updateNode.parentNode.classList.toggle('d-none', true);
    }, 3000);
  }, 3000);
  
  window.addEventListener('offline', function(e) { 
    updateNode.parentNode.classList.toggle('d-none', false);
    updateNode.textContent = message.offline;
  });
  window.addEventListener('online', function(e) { 
    updateNode.textContent = message.online;
    window.setTimeout(function() {
      updateNode.parentNode.classList.toggle('d-none', true);
    }, 3000);
  });
  
  // PWA installer
  function initInstallButton() {
    let deferredPrompt = null;
    let btnInstall = $('.app-pwa-install-btn')[0];
    
    btnInstall.addEventListener('click', function() {
      btnInstall.classList.toggle('d-none', true);
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choiceResult => {
        deferredPrompt = null;
      });
    });
    
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      btnInstall.parentNode.classList.toggle('d-none', false);
    });
    
    this.install = function() {
    };
  }
    
  // customHandler
  function clientUpdateHandler(swo) {
    if (clientUpdateHandler.swo)
      clientUpdateHandler.swo.waiting.postMessage({action: 'skipWaiting'});
    else if (swo)
      swo.waiting.postMessage({action: 'skipWaiting'});
    
    new Promise(function(resolve, reject) {
      $('.bp-pwa-banner')[0].parentNode.classList.toggle('d-none', false);
      $('.bp-pwa-banner .btn-reload')[0].addEventListener('click', resolve);
    }).then(function() {
      if (clientUpdateHandler.swo && clientUpdateHandler.swo.waiting)
        clientUpdateHandler.swo.waiting.postMessage({action: 'skipWaiting'});
      else if (swo && swo.waiting)
        swo.waiting.postMessage({action: 'skipWaiting'});
      window.location.reload();
    });
  }
  
  initInstallButton();
  
  if (window.location.href.includes('https://pixelcaso.web.app/')) {
    
    // service worker handler
    if (typeof(navigator) !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then(function(swo) {
        
        if (!navigator.serviceWorker.controller)
          return;
          
        if (swo.waiting) {
          swo.waiting.postMessage({action: 'skipWaiting'});
          if (typeof(clientUpdateHandler) === 'undefined') {
            if (window.confirm(confirmMessage))
              location.href = location.href;
          } else {
            clientUpdateHandler(swo);
            clientUpdateHandler.swo = swo;
          }
          return;
        }
        
        if (swo.installing) {
          updateNode.parentNode.classList.toggle('d-none', false);
          updateNode.textContent = message.updating;
          swo.installing.addEventListener('statechange', function(e) {
            if (swo.installing.state == 'installed') {
              updateNode.textContent = message.success;
              swo.waiting.postMessage({action: 'skipWaiting'});
              if (typeof(clientUpdateHandler) === 'undefined') {
                if (window.confirm(confirmMessage))
                  location.href = location.href;
              } else {
                clientUpdateHandler(swo);
                clientUpdateHandler.swo = swo;
              }
            }
          });
          return;
        }
        
        swo.addEventListener('updatefound', function() {
          window.clearTimeout(checkVersionTimeout);
          updateNode.parentNode.classList.toggle('d-none', false);
          updateNode.textContent = message.downloading;
          swo.installing.addEventListener('statechange', function(e) {
            if (this.state == 'installed') {
              updateNode.textContent = message.success;
              swo.waiting.postMessage({action: 'skipWaiting'});
              if (typeof(clientUpdateHandler) === 'undefined') {
                if (window.confirm(confirmMessage))
                  location.href = location.href;
              } else {
                clientUpdateHandler(swo);
                clientUpdateHandler.swo = swo;
              }
            }
          });
        });
        
      }).catch(function(e) {
        console.error('Something went wrong.');
      });
    }
  
  }
  

})();