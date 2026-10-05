export default async function handler(req, res) {
  // 1. CORS configuration for FlutterFlow and Bubble compatibility
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-action');

  // Handle preflight OPTIONS requests instantly
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Capture incoming data parameters safely
    const data = req.method === 'POST' ? req.body : req.query;
    const xAction = req.headers['x-action'] || data.action || 'get_me';
    
    // Resolve token location dynamically (checks Bubble parameter first, then falls back to Vercel env)
    const bodyToken = req.body?.token_param || req.query?.token_param;
    const META_ACCESS_TOKEN = bodyToken || process.env.META_ACCESS_TOKEN;

    // 3. ROUTE A: Handle the Viral Calculator matrix if calculation metrics are passed explicitly
    if (data.views !== undefined || data.shares !== undefined || data.comments !== undefined) {
      const views = Number(data.views) || 0;
      const shares = Number(data.shares) || 0;
      const comments = Number(data.comments) || 0;

      // Threads to Millions Engagement Scoring Formula calculation
      const totalEngagement = (views * 0.05) + (shares * 3.0) + (comments * 2.0);
      const viralMultiplier = views > 0 ? ((shares + comments) / views) * 100 : 0;
      const finalViralScore = Math.min(Math.round(totalEngagement * (1 + viralMultiplier / 100)), 1000);

      let status = "Average Performance";
      if (finalViralScore > 750) status = "🔥 Going Mega Viral!";
      else if (finalViralScore > 400) status = "📈 High Growth Traction";

      return res.status(200).json({
        success: true,
        metrics: { views, shares, comments },
        viralScore: finalViralScore,
        status: status,
        reachMultiplier: Number(viralMultiplier.toFixed(2))
      });
    }

    // 4. ROUTE B: Threads API Proxy Handlers Validation
    if (!META_ACCESS_TOKEN) {
      return res.status(400).json({ error: "Missing Meta API credentials. Please pass a token_param inside your request body or configure META_ACCESS_TOKEN in Vercel environment variables." });
    }

    // ROUTE 1: Get Profile Information
    if (xAction === 'get_me') {
      const fields = data.fields || 'id,username';
      const response = await fetch(`https://threads.net{fields}&access_token=${META_ACCESS_TOKEN}`); 
      const threadsData = await response.json();
      return res.status(response.status || 200).json(threadsData);
    }

    // ROUTE 2: Create Text Container
    if (xAction === 'create_container') {
      const text = data.text || req.body?.text;
      const userId = data.userId || req.body?.userId || 'me';
      
      if (!text) {
        return res.status(400).json({ error: "Text parameter is required to create a container." });
      }

      const response = await fetch(`https://threads.net{userId}/threads?text=${encodeURIComponent(text)}&media_type=TEXT&access_token=${META_ACCESS_TOKEN}`, {
        method: 'POST'
      });
      const threadsData = await response.json();
      return res.status(response.status || 200).json(threadsData);
    }

    // ROUTE 3: Publish Container (With Built-In Server Delay!)
    if (xAction === 'publish_container') {
      const creationId = data.creationId || req.body?.creationId;
      const userId = data.userId || req.body?.userId || 'me';

      if (!creationId) {
        return res.status(400).json({ error: "creationId parameter is required to publish a container." });
      }

      // Enforce absolute 7-second breathing room so Meta can compile your caption container cleanly
      await new Promise((resolve) => setTimeout(resolve, 7000));

      const response = await fetch(`https://threads.net{userId}/threads_publish?creation_id=${creationId}&access_token=${META_ACCESS_TOKEN}`, {
        method: 'POST'
      });
      const threadsData = await response.json();
      return res.status(response.status || 200).json(threadsData);
    }

    // Fallback error trap if parameters match absolutely nothing
    return res.status(400).json({ error: "No metrics or valid actions matched on Vercel Engine." });

  } catch (error) {
    // Global runtime error handler
    return res.status(500).json({ success: false, error: error.message });
  }
}
