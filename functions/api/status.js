/* Cloudflare Pages Function; only deployed through Git integration or Wrangler. */
export function onRequestGet({env}){
  return new Response(JSON.stringify({sync:!!env.MISTERA_DB}),{
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
  });
}
