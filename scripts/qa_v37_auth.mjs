#!/usr/bin/env node
/* Node-only QA for locked PRD assets, signature, rate limiter and D1 persistence.
 * No live Cloudflare connection, secrets, account credentials or production writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker from '../worker/index.js';
import {prdProgressHash} from '../worker/private-access.js';
const cfg=JSON.parse(fs.readFileSync('wrangler.prd.jsonc','utf8'));
assert.equal(cfg.assets.run_worker_first,true,'Private assets must traverse the Worker');
assert.equal(cfg.vars.MISTERA_AUTH_REQUIRED,'1');
const store={attempts:new Map(),progress:new Map()};
const db={
  prepare(sql){const obj={sql,args:[],bind(...args){this.args=args;return this;},async run(){
    if(sql.includes('INSERT INTO mistera_auth_attempts')){
      const [key,windowStart]=this.args;const old=store.attempts.get(key);
      store.attempts.set(key,{count:old&&old.windowStart===windowStart?old.count+1:1,windowStart});
    }else if(sql.includes('INSERT INTO gift_progress')){
      const [id,day,field,value]=this.args,pk=`${id}:${day}:${field}`,prior=store.progress.get(pk);
      store.progress.set(pk,field==='d02-hints'?String(Math.max(Number(prior?.value||0),Number(value))):prior?.value||value);
      if(!prior)store.progress.set(pk,{id,day,field,value});
      else if(field==='d02-hints')store.progress.set(pk,{id,day,field,value:String(Math.max(Number(prior.value||0),Number(value)))});
    }return {success:true};},async first(){
      if(sql.includes('FROM mistera_auth_attempts'))return {attempts:store.attempts.get(this.args[0])?.count||0};
      if(sql.includes('sqlite_master'))return {name:'gift_progress'};
      return null;
    },async all(){
      if(sql.includes('FROM gift_progress'))return {results:[...store.progress.values()].filter(x=>x.id===this.args[0]).map(({day,field,value})=>({day,field,value_json:value}))};
      return {results:[]};
    }};return obj;},
  async batch(statements){for(const s of statements)await s.run();}
};
const assets={async fetch(req){return new Response('PRIVATE-VILLA-FILE',{headers:{'Content-Type':'text/plain'}})}};
const env={MISTERA_AUTH_REQUIRED:'1',MISTERA_ACCESS_CODE:'112233',MISTERA_SESSION_KEY:'long-test-key-not-real-32-digits-zzzz',MISTERA_PROGRESS_KEY:'stable-test-progress-key-32-characters-long',MISTERA_DB:db,ASSETS:assets};
const request=(path,{method='GET',code,cookie,ip='192.0.2.1',pairingCode,snapshot}={})=>new Request('https://mistera.test'+path,{method,headers:{...(cookie?{cookie}:{}),'CF-Connecting-IP':ip,...(method==='POST'?{'content-type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(code!==undefined?{code}:{pairingCode,snapshot})}:{})});
const run=(path,opts={})=>worker.fetch(request(path,opts),env,{});
const status=async(path,options,expected)=>{const res=await run(path,options);assert.equal(res.status,expected,`${path} returned ${res.status}, expected ${expected}`);return res;};
assert.equal((await status('/',{},200)).headers.get('content-type')?.startsWith('text/html'),true);
let splash=await(await run('/')).text();assert.ok(splash.includes('id="code"') && splash.includes('inputmode="numeric"') && !splash.includes('numeritos'));
assert.ok(!splash.includes('assets/aldea-base.png'));
await status('/assets/aldea-base.png',{},401);await status('/api/progress',{method:'POST',pairingCode:'a'.repeat(32),snapshot:{}},401);
await status('/api/auth',{method:'POST',code:'999999',ip:'192.0.2.2'},401);
const logged=await status('/api/auth',{method:'POST',code:'112233',ip:'192.0.2.3'},200);
const cookie=logged.headers.get('set-cookie');assert.ok(cookie?.includes('HttpOnly')&&cookie.includes('Secure')&&cookie.includes('SameSite=Lax'));
const authCookie=cookie.split(';')[0];
assert.equal(await(await status('/api/auth',{cookie:authCookie},200)).json().then(x=>x.authenticated),true);
const assetsRes=await status('/assets/aldea-base.png',{cookie:authCookie},200);
assert.equal(assetsRes.headers.get('cache-control'),'private, max-age=3600');
const invalidSignature=authCookie.slice(0,-1)+'x';await status('/assets/aldea-base.png',{cookie:invalidSignature},401);
const snapshotA={opened:[1],final:false,stages:{2:{'d02-hints':2}}},snapshotB={opened:[],final:false,stages:{2:{'d02-hints':1}}};
const codeA='a'.repeat(32),codeB='b'.repeat(32);
await status('/api/progress',{method:'POST',cookie:authCookie,pairingCode:codeA,snapshot:snapshotA},200);
const sync=await(await status('/api/progress',{method:'POST',cookie:authCookie,pairingCode:codeB,snapshot:snapshotB},200)).json();
assert.deepEqual(sync.snapshot.opened,[1]);assert.equal(sync.snapshot.stages[2]['d02-hints'],2);
for(let i=0;i<6;i++)await status('/api/auth',{method:'POST',code:'999999',ip:'198.51.100.10'},i<5?401:429);
const badEnv={...env,MISTERA_SESSION_KEY:''};
assert.equal((await worker.fetch(request('/'),badEnv,{})).status,503);
const changedSessionEnv={...env,MISTERA_SESSION_KEY:'different-signing-secret-long-32-characters'};
assert.equal(await prdProgressHash(env),await prdProgressHash(changedSessionEnv),'Rotating cookie-signing secret must NOT change progress identity');
assert.equal(await prdProgressHash(env),await prdProgressHash({...env,MISTERA_ACCESS_CODE:'445566'}),'Changing romantic code must NOT change progress identity');
await status('/api/auth',{cookie:authCookie},200);
assert.equal((await worker.fetch(request('/assets/aldea-base.png',{cookie:authCookie}),changedSessionEnv,{})).status,401);
assert.equal((await (await worker.fetch(request('/api/auth',{method:'POST',code:'112233',ip:'192.0.2.27'}),changedSessionEnv,{})).json()).authenticated,true);
const testEnv={...env,MISTERA_AUTH_REQUIRED:'0'};
assert.equal((await worker.fetch(request('/assets/aldea-base.png'),testEnv,{})).status,200);
console.log('PASS: MISTERA private entry, six-digit secret, HttpOnly session, protected assets/API, rate limits, shared D1 progress, fail-closed PRD, optional TEST.');
