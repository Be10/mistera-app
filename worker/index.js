/* MISTERA V36 - Worker Static Assets + D1, sin Pages Functions. */
import { onRequestPost as saveProgress } from '../functions/api/progress.js';
import { onRequestGet as getStatus } from '../functions/api/status.js';
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/api/status') {
      return request.method==='GET'?getStatus({request,env,ctx}):json(405,{error:'Metodo no permitido'});
    }
    if(url.pathname==='/api/progress') {
      return request.method==='POST'?saveProgress({request,env,ctx}):json(405,{error:'Usa POST'});
    }
    if(url.pathname.startsWith('/api/'))return json(404,{error:'Ruta no encontrada'});
    return env.ASSETS.fetch(request);
  }
};
