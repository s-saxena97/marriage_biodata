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

## 2. Connect a KV store (required for the Publish button)

The Publish button needs somewhere to store the "latest version" so it's the
same for every visitor. Vercel's KV store (hosted Redis) is the natural fit
and takes two minutes:

1. In your Vercel project, go to the **Storage** tab.
2. Click **Create Database → KV**, give it a name, create it.
3. On the "Connect to Project" step, select this project and the
   Production (and Preview, if you want) environment.
4. Redeploy the project once (**Deployments → ⋯ → Redeploy**) so the new
   environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) are
   picked up. Vercel sets these automatically — you don't need to type
   anything in yourself.

That's it — `api/biodata.js` reads those environment variables through the
`@vercel/kv` package automatically.

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
