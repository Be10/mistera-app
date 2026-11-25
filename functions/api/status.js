/* MISTERA: report cloud sync as ready only after its required table exists.
 * This read-only check does not change or reveal application data. */
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
export async function onRequestGet({env}) {
  let sync = false;
  try {
    if (env?.MISTERA_DB) {
      const table = await env.MISTERA_DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='gift_progress' LIMIT 1"
      ).first();
      sync = Boolean(table);
    }
  } catch (_) {
    sync = false;
  }
  return new Response(JSON.stringify({sync}), {headers});
}
