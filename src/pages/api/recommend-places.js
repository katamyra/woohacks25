import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { review } = req.body;

    try {
        const result = await model.generateContent(review);
        const response = await result.response;
        const recommendations = response.text().split(',');
        
        const places = await Promise.all(recommendations.map(async (place) => {
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
            const geocodeResponse = await axios.get(geocodeUrl);
            const location = geocodeResponse.data.results[0]?.geometry.location;
            return { place, ...location };
        }));

        res.status(200).json(places);
    } catch (error) {
        console.error("Error generating recommendations:", error);
        res.status(500).json({ error: "Failed to generate recommendations" });
    }
} 