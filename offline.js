// Bound every worker wait so an unsupported or stalled browser gets an actionable error.
export function activeWorker(registration,timeoutMs=30000){
 const worker=registration.installing||registration.waiting||registration.active;
 if(!worker)return Promise.reject(new Error('Offline installation has not started. Reload this page while online and try again.'));
 if(worker.state==='activated')return Promise.resolve(worker);
 return new Promise((resolve,reject)=>{
  const finish=(error)=>{clearTimeout(timer);worker.removeEventListener('statechange',changed);error?reject(error):resolve(worker);};
  const changed=()=>{if(worker.state==='activated')finish();else if(worker.state==='redundant')finish(new Error('Offline installation failed. Check your connection and try again.'));};
  const timer=setTimeout(()=>finish(new Error('Offline installation timed out. Reload this page while online and try again.')),timeoutMs);
  worker.addEventListener('statechange',changed);changed();
 });
}
export function offlineRequest(worker,repair=false,onProgress=()=>{},timeoutMs=30000){
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();
  const finish=(error,result)=>{clearTimeout(timer);channel.port1.close();error?reject(error):resolve(result);};
  const timer=setTimeout(()=>finish(new Error('Offline preparation timed out. Check your connection and try again.')),timeoutMs);
  channel.port1.onmessage=({data})=>{if(data.type==='OFFLINE_PROGRESS')onProgress(data);else if(data.type==='OFFLINE_READY')finish(null,data);};
  try{worker.postMessage({type:repair?'PREPARE_OFFLINE':'CHECK_OFFLINE'},[channel.port2]);}catch(error){finish(error);}
 });
}
