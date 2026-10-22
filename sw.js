const CACHE='lakefront-fieldbook-v1';
const FILES=['./','./index.html','./styles.css','./app.js','./core.js','./config.js','./vendor/leaflet.js','./vendor/leaflet.css','./data/poles.geojson','./data/streets.geojson','./data/Lakefront-transformer-poles.kmz','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lakefront-fieldbook-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put('./index.html',r.clone()));return r;}).catch(()=>caches.match('./index.html')));return;}
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
self.addEventListener('message',e=>{if(e.data==='CHECK_OFFLINE')e.waitUntil(caches.open(CACHE).then(async c=>{const checks=await Promise.all(FILES.map(f=>c.match(f)));e.source.postMessage({type:'OFFLINE_READY',ready:checks.every(Boolean)});}));});
