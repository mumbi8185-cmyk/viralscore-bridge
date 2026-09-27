export default async function handler(req, res) {
  // 1. CORS headers allow your main frontend app to talk to this bridge safely
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 2. Safely extract secret tokens from Vercel instead of exposing them on GitHub
    const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN; 

    if (!META_ACCESS_TOKEN) {
      return res.status(500).json({ error: "Configuration Error: Bridge is missing Meta API credentials." });
    }

    // 3. Forward request to Meta's servers behind the scenes
    const metaResponse = await fetch(`https://threads.net{META_ACCESS_TOKEN}`);
    const metaData = await metaResponse.json();

    // 4. Return clean data back to your app frontend
    return res.status(200).json({
      success: true,
      bridge_status: "Operational",
      data: metaData
    });

  } catch (error) {
    // If Meta blocks or suspends your token, your app won't crash! It catches it here gracefully.
    return res.status(500).json({ 
      success: false, 
      bridge_status: "Meta Connection Suspended/Failed", 
      error: error.message 
    });
  }
}
