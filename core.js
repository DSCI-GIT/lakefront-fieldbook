export function validEvent(e, ids) {
  return !!e && /^[a-zA-Z0-9_-]{8,90}$/.test(e.id) && ids.has(e.poleId) && ['status','note'].includes(e.type) && Number.isFinite(Date.parse(e.at)) && typeof e.by === 'string' && e.by.length <= 60 && (e.type === 'status' ? typeof e.value === 'boolean' : typeof e.value === 'string' && e.value.length > 0 && e.value.length <= 2000);
}
export function reduceEvents(events) {
  const state = new Map();
  for (const e of [...events].sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id))) {
    const p=state.get(e.poleId)||{done:false,notes:[]};
    if(e.type==='status'){p.done=e.value;p.statusEvent=e;} else p.notes.push(e);
    state.set(e.poleId,p);
  }
  return state;
}
export function mergeEvents(a,b){return [...new Map([...a,...b].map(e=>[e.id,e])).values()];}
export function distanceMetres(a,b){const r=Math.PI/180,dlat=(b[0]-a[0])*r,dlon=(b[1]-a[1])*r;return 6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dlon/2)**2)));}
export function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
