/* Monotonic cloud progress; an unguessable pairing secret never enters the DB. */
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const answer=(status,obj)=>new Response(JSON.stringify(obj),{status,headers:JSON_HEADERS});
const safeToken=t=>typeof t==='string'&&/^[A-Za-z0-9_-]{32,128}$/.test(t);
const validKey=k=>typeof k==='string'&&/^[a-zA-Z0-9_:-]{1,70}$/.test(k);
const hash=async value=>{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('mistera-gift-progress-v34:'+value));
  return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
};
function fields(snapshot){
  const rows=[];
  if(Array.isArray(snapshot?.opened))for(const day of [...new Set(snapshot.opened)]){
    if(Number.isInteger(day)&&day>=1&&day<=24)rows.push([day,'_opened','true']);
  }
  if(snapshot?.final===true)rows.push([25,'_final','true']);
  if(snapshot?.stages && typeof snapshot.stages==='object')for(const [d,values] of Object.entries(snapshot.stages)){
    const day=Number(d);if(!Number.isInteger(day)||day<1||day>25||!values||typeof values!=='object')continue;
    for(const [key,value] of Object.entries(values)){
      if(!validKey(key)||rows.length>220)continue;
      if(key==='d02-hints')rows.push([day,key,String(Math.max(0,Math.min(3,Number(value)||0)))]);
      else if(value===true)rows.push([day,key,'true']);
      else if(value && typeof value==='object' && JSON.stringify(value).length<450)rows.push([day,key,JSON.stringify(value)]);
    }
  }
  return rows;
}
export async function onRequestPost({request,env,progressUserHash=null}){
  if(!env.MISTERA_DB)return answer(503,{error:'D1 no configurada'});
  if((Number(request.headers.get('content-length'))||0)>28000)return answer(413,{error:'Solicitud demasiado grande'});
  const origin=request.headers.get('origin');
  if(origin && origin!==new URL(request.url).origin)return answer(403,{error:'Origen inválido'});
  let input;
  try{input=await request.json();}catch(_){return answer(400,{error:'JSON inválido'});}
  if(!safeToken(input?.pairingCode))return answer(401,{error:'Código de vinculación inválido'});
  const id=progressUserHash || await hash(input.pairingCode);
  const proposed=fields(input.snapshot),db=env.MISTERA_DB;
  try{
    if(proposed.length){
      const sql=`INSERT INTO gift_progress (user_hash,day,field,value_json,updated_at)
        VALUES (?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(user_hash,day,field) DO UPDATE SET
          value_json=CASE WHEN excluded.field='d02-hints'
              THEN CAST(MAX(CAST(gift_progress.value_json AS INTEGER),CAST(excluded.value_json AS INTEGER)) AS TEXT)
            ELSE gift_progress.value_json END,
          updated_at=CURRENT_TIMESTAMP`;
      // Each field is append-only except the increasing hint counter; no device can
      // accidentally undo an already opened gift or reset a discovered state.
      await db.batch(proposed.map(([day,field,value])=>db.prepare(sql).bind(id,day,field,value)));
    }
    const data=await db.prepare('SELECT day,field,value_json FROM gift_progress WHERE user_hash=? ORDER BY day').bind(id).all();
    const snapshot={opened:[],final:false,stages:{}};
    for(const row of data.results||[]){
      if(row.field==='_opened')snapshot.opened.push(row.day);
      else if(row.field==='_final')snapshot.final=true;
      else{
        snapshot.stages[row.day]??={};
        try{snapshot.stages[row.day][row.field]=JSON.parse(row.value_json);}catch(_){}
      }
    }
    return answer(200,{snapshot});
  }catch(_){return answer(503,{error:'No se pudo guardar el progreso'});}
}
export const onRequestGet=()=>answer(405,{error:'Usa POST'});
