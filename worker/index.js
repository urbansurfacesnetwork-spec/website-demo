// Cloudflare Worker: stores ONE artwork PNG in KV. GET /artwork returns it,
// POST /artwork overwrites it, a weekly cron trigger clears it.
const KEY = 'artwork';
const MAX_BYTES = 5 * 1024 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = cors(env);
    if (url.pathname !== '/artwork') return new Response('Not found', { status: 404, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    if (request.method === 'GET') {
      const data = await env.ARTWORK.get(KEY, 'arrayBuffer');
      // No stored image (never saved, or cleared by the cron) = blank canvas
      if (!data) return new Response('No artwork', { status: 404, headers });
      return new Response(data, {
        headers: { ...headers, 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
      });
    }

    if (request.method === 'POST') {
      const declared = Number(request.headers.get('Content-Length') || 0);
      if (declared > MAX_BYTES) return new Response('Too large', { status: 413, headers });
      const data = await request.arrayBuffer();
      if (data.byteLength > MAX_BYTES) return new Response('Too large', { status: 413, headers });
      const bytes = new Uint8Array(data);
      if (bytes.length < 8 || !PNG_MAGIC.every((b, i) => bytes[i] === b)) {
        return new Response('Not a PNG', { status: 400, headers });
      }
      await env.ARTWORK.put(KEY, data);
      return new Response('OK', { status: 200, headers });
    }

    return new Response('Method not allowed', { status: 405, headers });
  },

  // Weekly blank: deleting the object means GET returns 404 = blank canvas
  async scheduled(event, env) {
    await env.ARTWORK.delete(KEY);
  },
};
