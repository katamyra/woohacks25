// utils/fetchRecommendations.js
import axios from 'axios';

export async function fetchRecommendations(review, { address, lng, lat }) {
  try {
    const response = await axios.post('/api/recommend-places', { review, address, lng, lat });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}
