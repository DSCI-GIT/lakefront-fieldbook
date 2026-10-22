import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {activeWorker,offlineRequest} from '../offline.js';

test('worker activation waits for an update instead of using the old worker',async()=>{
 const worker=new EventTarget();worker.state='installing';
 const waiting=activeWorker({installing:worker,active:{state:'activated'}},100);
 worker.state='activated';worker.dispatchEvent(new Event('statechange'));
 assert.equal(await waiting,worker);
});
test('stalled worker and missing worker return errors instead of waiting indefinitely',async()=>{
 const worker=new EventTarget();worker.state='installing';
 await assert.rejects(activeWorker({installing:worker},5),/timed out/);
 await assert.rejects(activeWorker({}),/has not started/);
});
test('offline request reports progress and awaits the actual result',async()=>{
 const progress=[];
 const worker={postMessage(message,[port]){assert.equal(message.type,'PREPARE_OFFLINE');port.postMessage({type:'OFFLINE_PROGRESS',saved:5,total:6});port.postMessage({type:'OFFLINE_READY',ready:true});port.close();}};
 assert.equal((await offlineRequest(worker,true,p=>progress.push(p),100)).ready,true);
 assert.equal(progress[0].saved,5);
});
test('an unresponsive worker produces an actionable timeout',async()=>{
 const worker={postMessage(message,[port]){port.close();}};
 await assert.rejects(offlineRequest(worker,true,()=>{},5),/timed out/);
});
function workerHarness(fail=false){
 const source=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),listeners={},messages=[],saved=new Set();
 let files;
 const context={self:{addEventListener:(type,fn)=>listeners[type]=fn},caches:{open:async()=>({match:async file=>saved.has(file)?{}:undefined,add:async request=>{if(fail)throw new Error('network unavailable');saved.add(request.url);}})},Request:class{constructor(url){this.url=url;}}};
 vm.runInNewContext(source+'\nself.files=FILES;',context);files=context.self.files;
 return {files,saved,messages,async request(){let done;listeners.message({data:{type:'PREPARE_OFFLINE'},ports:[{postMessage:data=>messages.push(data)}],waitUntil:p=>done=p});await done;return messages.at(-1);}};
}
test('offline preparation repairs missing cached files before reporting success',async()=>{
 const harness=workerHarness();harness.saved.add(harness.files[0]);
 const result=await harness.request();assert.equal(result.ready,true);assert.equal(harness.saved.size,harness.files.length);assert(harness.messages.some(m=>m.type==='OFFLINE_PROGRESS'));
});
test('offline preparation reports incomplete downloads without claiming success',async()=>{
 const harness=workerHarness(true);const result=await harness.request();assert.equal(result.ready,false);assert.match(result.error,/could not download/);
});
