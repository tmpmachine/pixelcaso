let cacheName = 'pixelcaso-MTM1ODE4MzE';
let cacheRevision = 1; // increase to trigger force update on all clients

// delete old cache versioning
// use manifest-cache.json for future updates
function clearOlderVersionCache() {
  caches.keys().then(function(c){
    c.map(function(cacheName){
      if (cacheName.includes('pixelcaso-v')) {
        caches.delete(cacheName);
      }
    });
  });
}

function extractUrlsFromJson(json) {
  let urls = [];
  for (let key in json) {
    if (key == "skip") {
      continue;
    }
    if (Array.isArray(json[key])) {
      urls = urls.concat(json[key]);
    }
  }
  return urls;
}

function recache() {
  clearOlderVersionCache();
  return fetch('manifest-cache.json')
    .then(res => res.json())
    .then(json => {
      let cacheURLs = extractUrlsFromJson(json);
      caches.delete(cacheName)
      .then(() => {
        caches.open(cacheName)
        .then(function(cache) {
          return Promise.all(
            cacheURLs.map(function(url) {
              return cache.add(url).catch(function(error) {
                console.error('Failed to cache URL:', url, error);
              });
            })
          );
        })
        .then(function() {
          console.log('Files successfully cached.');
        })
        .catch(function(error) {
          console.log(error);
          console.log('Failed to cache all required files.');
        });
      });
    });
}


self.addEventListener('activate', function(e) {
  e.waitUntil(
    recache()
  );
});

self.addEventListener('install', function(event) {
  event.waitUntil(
    recache()
  );
});

self.addEventListener('message', function(e) {
  if (e.data.action == 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(resp) {
      if (resp)
        return resp;
      
      return fetch(e.request).then(function(r) {
        return r;
      }).catch(function() {
        console.error('Check connection.');
      });
    })
  );
});