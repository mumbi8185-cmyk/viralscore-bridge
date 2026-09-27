export default async function handler(req, res) {
  // CORS configuration allows Thunder Client & your frontend to talk to Vercel safely
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    if (!META_ACCESS_TOKEN) {
      return res.status(500).json({ error: "Missing Meta API credentials on Vercel." });
    }

    // Capture the target action sent from your Thunder Client request header or body
    const action = req.headers['x-action'] || req.body?.action || 'get_me';

    // ROUTE 1: Get Profile Info
    if (action === 'get_me') {
      const response = await fetch(`https://threads.net{META_ACCESS_TOKEN}`);
      const data = await response.json();
      return res.status(200).json(data);
    }

    // ROUTE 2: Create Text Container
    if (action === 'create_container') {
      const { text, userId } = req.body;
      const targetUserId = userId || 'me';
      const response = await fetch(`https://threads.net{targetUserId}/threads?text=${encodeURIComponent(text)}&media_type=TEXT&access_token=${META_ACCESS_TOKEN}`, {
        method: 'POST'
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    // ROUTE 3: Publish Container
    if (action === 'publish_container') {
      const { creationId, userId } = req.body;
      const targetUserId = userId || 'me';
      const response = await fetch(`https://threads.net{targetUserId}/threads_publish?creation_id=${creationId}&access_token=${META_ACCESS_TOKEN}`, {
        method: 'POST'
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: "Invalid action specified to proxy bridge." });

  } catch (error) {
    return res.status(500).json({ success: false, bridge_error: error.message });
  }
}
