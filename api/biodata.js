import { Redis } from '@upstash/redis';

// Reads whichever env var names the Vercel/Upstash integration happened to set -
// different integration paths have used different names over time.
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});

// Everyone who opens the deployed site reads/writes this one key.
// Upstash Redis is what actually persists it across visitors and deploys.
const KEY = 'biodata:doc';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const data = await redis.get(KEY);
      if (!data) {
        return res.status(404).json({ error: 'Nothing published yet' });
      }
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({
        error: 'Could not read the published biodata. Have you connected an Upstash Redis database to this project? See README.md.'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const incoming = req.body;
      if (!incoming || !Array.isArray(incoming.sections)) {
        return res.status(400).json({ error: 'Invalid biodata payload.' });
      }
      const existing = await redis.get(KEY);
      const shareVersion = ((existing && existing.shareVersion) || 0) + 1;
      const toSave = {
        ...incoming,
        shareVersion,
        publishedAt: new Date().toISOString()
      };
      await redis.set(KEY, toSave);
      return res.status(200).json(toSave);
    } catch (err) {
      return res.status(500).json({
        error: 'Could not publish. Have you connected an Upstash Redis database to this project? See README.md.'
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
