/* MISTERA Worker: independent TEST/PRD D1 + protected Static Assets. */
import { onRequestPost as saveProgress } from '../functions/api/progress.js';
import { onRequestGet as getStatus } from '../functions/api/status.js';
import { authenticated,authRoute,authConfigured,authIsEnabled,prdProgressHash } from './private-access.js';
import { lockedShell } from './splash.js';
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    const mustAuth=authIsEnabled(env);
    if(mustAuth&&!authConfigured(env))return json(503,{error:'Acceso privado no configurado. Ningún recurso personal se ha publicado.'});
    if(url.pathname==='/api/auth')return authRoute(request,env);
    if(mustAuth&&!(await authenticated(request,env))){
      if(request.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html'))return lockedShell();
      return json(401,{error:'Acceso privado. Introduce el código desde la pantalla de inicio.'});
    }
    if(url.pathname==='/api/status')return request.method==='GET'?getStatus({request,env,ctx}):json(405,{error:'Método no permitido'});
    if(url.pathname==='/api/progress'){
      if(request.method!=='POST')return json(405,{error:'Usa POST'});
      // PRD uses one protected identity across authorized devices, never a browser-local pairing token.
      return saveProgress({request,env,ctx,progressUserHash:mustAuth?await prdProgressHash(env):null});
    }
    if(url.pathname.startsWith('/api/'))return json(404,{error:'Ruta no encontrada'});
    const response=await env.ASSETS.fetch(request);
    if(!mustAuth||!response.ok)return response;
    const headers=new Headers(response.headers);
    headers.set('cache-control',url.pathname==='/'||url.pathname.endsWith('.html')?'private, no-store':'private, max-age=3600');
    headers.set('vary','Cookie');
    headers.set('x-content-type-options','nosniff');
    return new Response(response.body,{status:response.status,headers});
  }
};
