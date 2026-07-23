import { kv } from '@vercel/kv';

// Everyone who opens the deployed site reads/writes this one key.
// Vercel KV (a hosted Redis) is what actually persists it across visitors and deploys.
const KEY = 'biodata:doc';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await kv.get(KEY);
      if (!data) {
        return res.status(404).json({ error: 'Nothing published yet' });
      }
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({
        error: 'Could not read the published biodata. Have you connected a Vercel KV store to this project? See README.md.'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const incoming = req.body;
      if (!incoming || !Array.isArray(incoming.sections)) {
        return res.status(400).json({ error: 'Invalid biodata payload.' });
      }
      const existing = await kv.get(KEY);
      const shareVersion = ((existing && existing.shareVersion) || 0) + 1;
      const toSave = {
        ...incoming,
        shareVersion,
        publishedAt: new Date().toISOString()
      };
      await kv.set(KEY, toSave);
      return res.status(200).json(toSave);
    } catch (err) {
      return res.status(500).json({
        error: 'Could not publish. Have you connected a Vercel KV store to this project? See README.md.'
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
