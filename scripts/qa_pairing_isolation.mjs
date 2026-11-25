/* Regression: pairing a second device cannot upload its unrelated local progress. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {onRequestPost} from '../functions/api/progress.js';

const history=new Map();
const db={
  prepare(sql){return {bind(...args){return {args,
    async all(){const user=args[0];return {results:[...history.values()].filter(r=>r.user===user).map(r=>({day:r.day,field:r.field,value_json:r.value}))};}
  };}};},
  async batch(ops){for(const op of ops){const [user,day,field,value]=op.args;const key=[user,day,field].join(':'),before=history.get(key);
    const stored=before?(field==='d02-hints'?String(Math.max(Number(before.value),Number(value))):before.value):value;
    history.set(key,{user,day,field,value:stored});}return [];}
};
async function backend(path,options){
  if(path.startsWith('content/'))return new Response('{}',{headers:{'content-type':'application/json'}});
  if(path==='/api/status')return new Response('{"sync":true}',{headers:{'content-type':'application/json'}});
  if(path==='/api/progress'){
    const req=new Request('https://mistera.test/api/progress',{method:'POST',headers:options.headers,body:options.body});
    return onRequestPost({request:req,env:{MISTERA_DB:db}});
  }
  throw Error('Unexpected path: '+path);
}
function device(initialOpened,stages){
  const storage=new Map([
    ['mistera-escena-v5-opened',JSON.stringify(initialOpened)],
    ['mistera-surprises-v23-progress',JSON.stringify(stages)],
  ]);
  let progress=structuredClone(stages);
  const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
  const S={
    getAllProgress:()=>structuredClone(progress),
    importProgress:(next)=>{for(const [day,values] of Object.entries(next)){progress[day]??={};for(const [key,value] of Object.entries(values))progress[day][key]=value;}
      localStorage.setItem('mistera-surprises-v23-progress',JSON.stringify(progress));},
    replaceProgressFromLink:(next)=>{progress={};S.importProgress(next);},
    applyPublished:()=>false,
  };
  const listeners={};
  const window={MisteraSurprises:S,MisteraRefreshFromCloud:()=>{},addEventListener:(name,handler)=>((listeners[name]??=[]).push(handler)),dispatchEvent:()=>{}};
  const sandbox={window,document:{hidden:false,querySelector:()=>({content:'on'}),addEventListener:()=>{}},
    localStorage,location:{search:''},crypto:webcrypto,btoa,URLSearchParams,fetch:backend,TextEncoder,setTimeout,clearTimeout,Event,console};
  const source=fs.readFileSync(new URL('../public/mistera-cloud-sync.js',import.meta.url),'utf8');
  vm.runInNewContext(source,sandbox,{filename:'mistera-cloud-sync.js'});
  return {cloud:window.MisteraCloud,storage, getOpened:()=>JSON.parse(localStorage.getItem('mistera-escena-v5-opened')),getStages:()=>structuredClone(progress),setOpened:(v)=>localStorage.setItem('mistera-escena-v5-opened',JSON.stringify(v))};
}
const first=device([1],{'2':{'d02-hints':2,'d02-opened':true}});
await first.cloud.ready;
assert.equal(first.cloud.available,true);
const sharedCode=first.cloud.pairingCode;
const second=device([2],{'2':{'d02-hints':1}});
await second.cloud.ready;
assert.notEqual(second.cloud.pairingCode,sharedCode);
assert.equal(await second.cloud.connect(sharedCode),true);
assert.deepEqual(second.getOpened(),[1]);
assert.equal(second.getStages()['2']['d02-hints'],2);
assert.ok([...second.storage.keys()].some(k=>k.startsWith('mistera-backup-before-link-v34-')));
await first.cloud.sync();
assert.deepEqual(first.getOpened(),[1]);
second.setOpened([1,3]);
await second.cloud.sync();
await first.cloud.sync();
assert.deepEqual(first.getOpened(),[1,3]);
const emptyCode='z'.repeat(32);
assert.equal(await second.cloud.connect(emptyCode),false);
assert.equal(second.cloud.pairingCode,sharedCode);
assert.deepEqual(second.getOpened(),[1,3]);
console.log('PASS: 2-device linking reads remote first, backs up local history, preserves older stages, shares updates and rejects a blank linked account.');
