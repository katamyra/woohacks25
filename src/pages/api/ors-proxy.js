// pages/api/ors-proxy.js
export default async function handler(req, res) {
    const { requestBody, orsProfile } = req.body;
    const orsApiKey = process.env.NEXT_PUBLIC_ORS_API_KEY; //
  
    if (!orsApiKey) {
      return res.status(500).json({ error: "ORS API key is missing" });
    }
  
    try {
      const apiUrl = `https://api.openrouteservice.org/v2/directions/${orsProfile}/geojson`;
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": orsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Error in ORS proxy:", error);
      res.status(500).json({ error: "Failed to fetch data from ORS" });
    }
  }
  