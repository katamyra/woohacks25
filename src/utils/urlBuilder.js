export function buildNearbySearchUrl({ location, radius, type, keyword }) {
    const placesApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!placesApiKey) {
      throw new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable');
    }
    return `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${placesApiKey}&location=${location}&radius=${radius}&type=${type}&keyword=${encodeURIComponent(keyword)}`;
  }
  