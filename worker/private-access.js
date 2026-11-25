/* MISTERA private invitation. No PIN, signing key or identity is shipped to browsers.
 * Only enabled when MISTERA_AUTH_REQUIRED=1. TEST retains Cloudflare Access.
 * All protected assets must pass through worker/index.js (run_worker_first=true).
 */
const enc = new TextEncoder();
const COOKIE='mistera_private_session';
const LIFETIME=365*24*60*60;
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store, private','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(status,data,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
const bytesToB64=(bytes)=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const hex=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const validSecrets=(env)=>/^\d{6}$/.test(String(env.MISTERA_ACCESS_CODE||'')) && String(env.MISTERA_SESSION_KEY||'').length>=32 && String(env.MISTERA_PROGRESS_KEY||'').length>=32;
const enabled=(env)=>env.MISTERA_AUTH_REQUIRED==='1';
const constantEquals=(a,b)=>{
  const left=enc.encode(String(a)),right=enc.encode(String(b));let diff=left.length^right.length;
  for(let i=0;i<Math.max(left.length,right.length);i++)diff|=(left[i]||0)^(right[i]||0);
  return diff===0;
};
async function signingKey(env){return crypto.subtle.importKey('raw',enc.encode(env.MISTERA_SESSION_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);}
const sign=async(env,text)=>bytesToB64(await crypto.subtle.sign('HMAC',await signingKey(env),enc.encode(text)));
function findCookie(request){const s=request.headers.get('cookie')||'';return s.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
export async function authenticated(request,env){
  if(!enabled(env))return true;
  if(!validSecrets(env))return false;
  const token=findCookie(request),parts=token.split('.');
  if(parts.length!==4||parts[0]!=='v1')return false;
  const exp=Number(parts[1]),nonce=parts[2];
  if(!Number.isSafeInteger(exp)||exp<=Date.now()||exp>Date.now()+LIFETIME*1000||!/^[A-Za-z0-9_-]{20,90}$/.test(nonce))return false;
  const signature=await sign(env,parts.slice(0,3).join('.'));
  return constantEquals(signature,parts[3]);
}
async function rateBucket(env,kind,key,limit,now){
  const id=await hex(`mistera-auth-attempts:${env.MISTERA_SESSION_KEY}:${kind}:${key}`);
  const windowStart=Math.floor(now/900)*900;
  await env.MISTERA_DB.prepare(`INSERT INTO mistera_auth_attempts (bucket,attempts,window_start)
    VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET
    attempts=CASE WHEN mistera_auth_attempts.window_start=? THEN mistera_auth_attempts.attempts+1 ELSE 1 END,
    window_start=?`).bind(id,windowStart,windowStart,windowStart).run();
  const state=await env.MISTERA_DB.prepare('SELECT attempts FROM mistera_auth_attempts WHERE bucket=?').bind(id).first();
  return Number(state?.attempts||1)>limit;
}
export function authIsEnabled(env){return enabled(env);}
export function authConfigured(env){return validSecrets(env)&&Boolean(env.MISTERA_DB);}
export async function prdProgressHash(env){return hex('mistera-private-recipient:v1:'+env.MISTERA_PROGRESS_KEY);}
export async function authRoute(request,env){
  if(!enabled(env))return reply(200,{required:false,authenticated:true});
  if(!authConfigured(env))return reply(503,{error:'Acceso privado aún no configurado'});
  if(request.method==='GET')return reply(200,{required:true,authenticated:await authenticated(request,env)});
  if(request.method!=='POST')return reply(405,{error:'Método no permitido'});
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return reply(403,{error:'Origen no autorizado'});
  if((Number(request.headers.get('content-length'))||0)>4096)return reply(413,{error:'Solicitud demasiado grande'});
  let body;
  try{body=await request.json();}catch(_){return reply(400,{error:'Solicitud inválida'});}
  const code=body?.code;
  if(typeof code!=='string'||!/^[0-9]{6}$/.test(code))return reply(400,{error:'Escribe los seis números'});
  try{
    const ip=request.headers.get('CF-Connecting-IP')||'unknown';
    const now=Math.floor(Date.now()/1000);
    const blockedIp=await rateBucket(env,'ip',ip,5,now);
    const blockedGlobal=await rateBucket(env,'global','everyone',60,now);
    if(blockedIp||blockedGlobal)return reply(429,{error:'Demasiados intentos. Inténtalo de nuevo dentro de 15 minutos.'});
    if(!constantEquals(code,env.MISTERA_ACCESS_CODE))return reply(401,{error:'Ese no es nuestro código. Intenta otra vez ❤️'});
    const exp=Date.now()+LIFETIME*1000,nonce=bytesToB64(crypto.getRandomValues(new Uint8Array(24)));
    const header=`v1.${exp}.${nonce}`;
    const value=`${header}.${await sign(env,header)}`;
    return reply(200,{authenticated:true},{'set-cookie':`${COOKIE}=${value}; Path=/; Max-Age=${LIFETIME}; HttpOnly; Secure; SameSite=Lax`});
  }catch(_){return reply(503,{error:'No se pudo comprobar el código. Inténtalo nuevamente.'});}
}
