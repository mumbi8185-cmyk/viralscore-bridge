export default async function handler(req, res) {
  // CORS configuration for FlutterFlow compatibility
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Capture data from either POST body or GET query parameters
    const data = req.method === 'POST' ? req.body : req.query;
    
    // Check if the request is trying to calculate a ViralScore matrix
    if (data.views !== undefined || data.shares !== undefined || data.comments !== undefined) {
      const views = Number(data.views) || 0;
      const shares = Number(data.shares) || 0;
      const comments = Number(data.comments) || 0;

      // Threads to Millions Engagement Scoring Formula calculation
      // Adjust weights if your course uses a different specific formula!
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

    // --- YOUR EXISTING THREADS PROXY ROUTES ---
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    const action = req.headers['x-action'] || data.action || 'get_me';

    if (action === 'get_me') {
      if (!META_ACCESS_TOKEN) return res.status(500).json({ error: "Missing Meta token." });
      const response = await fetch(`https://threads.net{META_ACCESS_TOKEN}`);
      const result = await response.json();
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: "No metrics or valid actions passed to Vercel Engine." });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
