# Biodata Builder — Vercel deployment

This folder is a ready-to-deploy Vercel project:

- `index.html` — the app (static, served as-is)
- `api/biodata.js` — a serverless function that stores the "published" version so **everyone who opens the link sees the same latest version**
- `package.json` — declares the one dependency the API function needs (`@vercel/kv`)

## 1. Deploy it

**Easiest — Vercel CLI, no GitHub needed:**
```
npm install -g vercel      # one-time
cd biodata-app
vercel                     # follow the prompts, accept the defaults
vercel --prod              # promote to your production URL
```

**Or via GitHub:** push this folder to a new GitHub repo, then in the Vercel
dashboard click **Add New → Project** and import that repo. Framework preset:
"Other" (it's static + one serverless function, no build step needed).

## 2. Connect a database (required for the Publish button)

Vercel retired its old standalone "KV" product — storage now lives under
**Marketplace Database Providers** in the Storage tab. We're using **Upstash**
(Redis), since it's REST-based and needs zero connection-pooling setup in a
serverless function — the easiest fit here.

1. In your Vercel project, go to the **Storage** tab → **Browse Storage**.
2. Under **Marketplace Database Providers**, click **Upstash**.
3. Create a new database (type **Redis**). Free tier is plenty for this.
4. On the "Connect to Project" step, select this project and the
   Production (and Preview, if you want) environment.
5. Redeploy the project once (**Deployments → ⋯ → Redeploy**) so the new
   environment variables are picked up. The integration sets these
   automatically — you don't need to type anything in yourself. (Our code
   checks for both `KV_REST_API_URL`/`KV_REST_API_TOKEN` and
   `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, since Vercel's
   integrations have used both names at different times — whichever Upstash
   gives you will work.)

That's it — `api/biodata.js` reads those environment variables through the
`@upstash/redis` package automatically.

**Alternatives**, if you'd rather use something else from that same Storage
screen: **Redis** (the official Redis Cloud option) works too, but it gives
you a `redis://` connection string instead of a REST API, which means
swapping `@upstash/redis` for a client like `ioredis` and managing a
persistent connection — a bit more setup in a serverless function. Neon or
Supabase (Postgres) would also work, but you'd be storing a single JSON blob
in a table instead of a natural key-value store — more moving parts than this
app needs. Upstash is the simplest match for what we're doing here.

## How it works

- **View mode** (default): loads whatever was last **published**, straight
  from `GET /api/biodata`. If nothing has been published yet, it falls back
  to the built-in starting content.
- **Edit mode**: unlocked with the code `1042` (change `AUTH_CODE` near the
  top of the `<script>` in `index.html` if you want a different one — this is
  a soft deterrent, not real authentication; don't rely on it for sensitive
  data).
- **Publish update**: sends the current document to `POST /api/biodata`,
  which increments a `shareVersion` number and stores it. The next time
  *anyone* opens the link (or refreshes), they get that version.
- **Download backup (.biodata)** / **Open backup file**: unrelated to
  publishing — a plain local JSON file export/import, useful for keeping a
  personal copy or moving edits between devices.

## Notes / limitations

- There's no user accounts here — "Edit mode" is a shared code, not a login.
  Anyone with the code (and the link) can publish. Fine for a family biodata
  page; not fine for anything sensitive.
- The API stores exactly one document (one biodata) per deployment. If you
  want multiple biodatas on the same deployment, the API and storage key
  would need a small extension (e.g. `/api/biodata?id=xyz`) — happy to add
  that if you need it.
- If you open `index.html` directly from disk (no server) or the KV store
  isn't connected yet, Publish will show a clear error and the app falls back
  to local-only behavior (Download/Open backup still work everywhere).
