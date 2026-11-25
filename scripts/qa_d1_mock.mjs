import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const mod=await import(pathToFileURL(resolve('functions/api/progress.js')).href);
const store=new Map();
const db={
  prepare(sql){return {sql, bind(...args){return {
    ...this,sql,args,
    async all(){const id=args[0];return {results:[...store.values()].filter(row=>row.id===id).map(row=>({day:row.day,field:row.field,value_json:row.value}))};}
  };}}},
  async batch(ops){for(const op of ops){const [id,day,field,value]=op.args;const k=id+':'+day+':'+field,prev=store.get(k);
    const v=prev?(field==='d02-hints'?String(Math.max(Number(prev.value),Number(value))):prev.value):value;
    store.set(k,{id,day,field,value:v});}return [];}
};
async function post(data,origin='https://mistera.example.test'){
  const request=new Request('https://mistera.example.test/api/progress',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin},body:JSON.stringify(data)});
  const response=await mod.onRequestPost({request,env:{MISTERA_DB:db}});
  return {status:response.status,body:await response.json()};
}
const code='a'.repeat(32);
const first=await post({pairingCode:code,snapshot:{opened:[1],final:false,stages:{2:{'d02-opened':true,'d02-hints':2}}}});
assert.equal(first.status,200); assert.deepEqual(first.body.snapshot.opened,[1]);assert.equal(first.body.snapshot.stages[2]['d02-hints'],2);
const second=await post({pairingCode:code,snapshot:{opened:[],final:false,stages:{2:{'d02-hints':1}}}});
assert.equal(second.status,200);assert.deepEqual(second.body.snapshot.opened,[1]);assert.equal(second.body.snapshot.stages[2]['d02-hints'],2);
assert.equal((await post({pairingCode:'bad',snapshot:{}})).status,401);
assert.equal((await post({pairingCode:code,snapshot:{}},'https://evil.invalid')).status,403);
console.log(JSON.stringify({status:'passed',checks:['Progreso monótono','Pistas no retroceden','Token inválido rechazado','Origen cruzado rechazado']}));
