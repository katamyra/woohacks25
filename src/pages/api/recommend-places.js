// pages/api/recommend-places.js
import axios from 'axios';
import { extractPlacesQueriesUrls } from '@/utils/extractPlacesQueriesUrls';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { review, address, lng, lat } = req.body;
    // Build query URLs based on the provided coordinates.
    const urls = extractPlacesQueriesUrls({ lat, lng });
    
    // Fire off all the GET requests concurrently.
    const requests = urls.map(url => axios.get(url));
    const responses = await Promise.all(requests);
    const results = responses.map(response => response.data);
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in recommend-places API:', error);
    res.status(500).json({ error: error.message });
  }
}
