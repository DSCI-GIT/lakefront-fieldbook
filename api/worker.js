const ORIGINS=['https://dsci-git.github.io','http://localhost:4173','http://127.0.0.1:4173'];
const JOB='lakefront-2026-10-22';
function headers(req){const o=req.headers.get('Origin');return {'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':ORIGINS.includes(o)?o:ORIGINS[0],'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Vary':'Origin'};}
function json(req,obj,status=200){return new Response(JSON.stringify(obj),{status,headers:headers(req)});}
function valid(e){return !!e&&/^[a-zA-Z0-9_-]{8,90}$/.test(e.id)&&typeof e.poleId==='string'&&e.poleId.length<=40&&e.jobId===JOB&&['note','status'].includes(e.type)&&Number.isFinite(Date.parse(e.at))&&Math.abs(Date.parse(e.at)-Date.now())<366*86400000&&typeof e.by==='string'&&e.by.length<=60&&(e.type==='status'?typeof e.value==='boolean':typeof e.value==='string'&&e.value.length>0&&e.value.length<=2000);}
export async function handle(req,env){
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(req)});
 if(new URL(req.url).pathname==='/health')return json(req,{ok:true,storage:!!env.BUCKET});
 if(req.method!=='POST'||new URL(req.url).pathname!=='/sync')return json(req,{ok:false,error:'Not found'},404);
 const code=req.headers.get('Authorization')?.replace(/^Bearer /,'').trim().toLowerCase();if(!env.CREW_CODE||code!==env.CREW_CODE.toLowerCase())return json(req,{ok:false,error:'Unauthorized'},401);
 if(!env.BUCKET)return json(req,{ok:false,error:'Storage not configured'},503);
 try{
  const raw=await req.text();if(raw.length>300000)return json(req,{ok:false,error:'Request too large'},413);
  const b=JSON.parse(raw);if(b.jobId!==JOB||!Array.isArray(b.events)||b.events.length>100||!b.events.every(valid))return json(req,{ok:false,error:'Invalid events'},400);
  for(let tries=0;tries<8;tries++){
   const obj=await env.BUCKET.get('lakefront/events-v1.json');const events=obj?await obj.json():[];const known=new Set(events.map(e=>e.id));const fresh=b.events.filter(e=>!known.has(e.id));
   if(!fresh.length)return json(req,{ok:true,accepted:b.events.map(e=>e.id),events});
   // Immutable IDs plus R2 conditional writes prevent duplicate retries or concurrent crew edits from losing data.
   const clean=fresh.map(({id,poleId,type,value,at,by,jobId})=>({id,poleId,type,value,at,by,jobId}));const merged=[...events,...clean];if(merged.length>20000)return json(req,{ok:false,error:'Job storage limit reached; export a backup'},409);
   const saved=await env.BUCKET.put('lakefront/events-v1.json',JSON.stringify(merged),{onlyIf:obj?{etagMatches:obj.etag}:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
   if(saved)return json(req,{ok:true,accepted:b.events.map(e=>e.id),events:merged});
  }
  return json(req,{ok:false,error:'Busy; retry shortly'},409);
 }catch(e){return json(req,{ok:false,error:'Sync failed; local records can be retried'},500);}
}
export default {fetch:handle};
