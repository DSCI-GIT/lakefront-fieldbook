const CACHE='lakefront-fieldbook-v4';
const FILES=['./','./index.html','./styles.css?v=4','./app.js?v=4','./offline.js','./core.js','./config.js','./vendor/leaflet.js','./vendor/leaflet.css','./data/poles.geojson','./data/streets.geojson','./data/Lakefront-transformer-poles.kmz','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lakefront-fieldbook-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put('./index.html',r.clone()));return r;}).catch(()=>caches.match('./index.html')));return;}
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
self.addEventListener('message',e=>{
 const type=typeof e.data==='string'?e.data:e.data?.type;
 if(type!=='CHECK_OFFLINE'&&type!=='PREPARE_OFFLINE')return;
 const reply=data=>{const target=e.ports?.[0]||e.source;target?.postMessage(data);};
 e.waitUntil((async()=>{
  try{const cache=await caches.open(CACHE),checks=await Promise.all(FILES.map(f=>cache.match(f)));
   let saved=checks.filter(Boolean).length;
   if(type==='PREPARE_OFFLINE'){
    reply({type:'OFFLINE_PROGRESS',saved,total:FILES.length});
    const results=await Promise.allSettled(FILES.filter((_,i)=>!checks[i]).map(async file=>{
     await cache.add(new Request(file,{cache:'reload'}));saved++;reply({type:'OFFLINE_PROGRESS',saved,total:FILES.length});
    }));
    const failure=results.find(result=>result.status==='rejected');
    if(failure){reply({type:'OFFLINE_READY',ready:false,error:'Some offline files could not download. Check your connection and try again.'});return;}
   }
   reply({type:'OFFLINE_READY',ready:saved===FILES.length,saved,total:FILES.length});
  }catch(error){reply({type:'OFFLINE_READY',ready:false,error:error.message});}
 })());
});

