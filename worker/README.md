# Shared artwork Worker (Cloudflare, free tier)

`paint-shared.html` loads the artwork with `GET /artwork`; the **Put it up** button sends `POST /artwork` (PNG). The Worker keeps a single image in KV (each save overwrites it) and a weekly cron deletes it, so the canvas goes blank.

## Setup
1. Make a free Cloudflare account; install Node.js.
2. `cd worker && npx wrangler login`
3. `npx wrangler kv namespace create ARTWORK` — copy the printed `id` into `wrangler.toml`.
4. `npx wrangler deploy` — prints a URL like `https://usrn-artwork.<you>.workers.dev`.
5. In `paint-shared.html` set `ARTWORK_URL` to `https://usrn-artwork.<you>.workers.dev/artwork`
   (or leave `/artwork` if you add a route on your own Cloudflare domain, e.g. `yoursite.com/artwork*`).
6. Optional: uncomment `ALLOWED_ORIGIN` in `wrangler.toml` and set it to your site's origin, then redeploy.

Cron schedule is in `wrangler.toml` (`0 0 * * 1` = Mondays 00:00 UTC). Free tier limits: KV allows 1,000 writes/day, 100,000 reads/day.
Note: anyone can POST (no login); the Worker only checks size (5 MB) and PNG header.
