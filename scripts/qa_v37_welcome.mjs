#!/usr/bin/env node
/* Node-only tests: single welcome viewing and cross-device D1 receipt semantics. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync('public/mistera-welcome.js','utf8');
const sharedProgress={test:{},prd:{}};
function client({env='test',enabled=true,message='Una notita privada ❤️',local=new Map()}={}){
  const stages=sharedProgress[env];
  const api={
    isCompleted:(_day,key)=>Boolean(stages[key]),
    complete:(_day,key,v)=>{stages[key]=v;}
  };
  const context={document:{documentElement:{classList:{contains:cls=>cls==='mistera-prd'&&env==='prd'}}},window:{MisteraSurprises:api,MisteraCloud:{ready:Promise.resolve(),sync:()=>Promise.resolve(true)}},fetch:async()=>({ok:true,json:async()=>({enabled,message})}),localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v)},setTimeout,Promise};
  vm.runInNewContext(script,context);
  return context.window.MisteraWelcome;
}
const a=client(),b=client();
assert.equal(await a.shouldShow(),true);
assert.equal(await b.shouldShow(),true);
a.markSeen();
assert.equal(await a.shouldShow(),false);
const prodLocal=new Map();
const prod=client({env:'prd',local:prodLocal});
assert.equal(await prod.shouldShow(),true,'PRD cannot inherit the TEST receipt');
prod.markSeen();
assert.equal(prodLocal.get('mistera-welcome-seen-prd'),'yes');
assert.equal(await prod.shouldShow(),false);
assert.equal(await b.shouldShow(),false,'new browser must respect shared remote stage');
assert.equal(await client({enabled:false}).shouldShow(),false,'unapproved content must never render');
console.log('PASS: one-time welcome, per-environment storage, shared D1 receipt, editorial enablement.');
