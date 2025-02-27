import axios from 'axios';

function getORSProfile(mode) {
  switch (mode.toLowerCase()) {
    case 'public':
      return 'driving-car'; 
    case 'walking':
      return 'foot-walking';
    case 'driving':
      return 'driving-car';
    case 'bicycle':
      return 'cycling-regular';
    default:
      throw new Error('Unsupported transportation mode');
  }
}

export const fetchSafeRouteORS = async (origin, destinationCoord, firePolygonsCollection) => {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userLocation = JSON.parse(localStorage.getItem("userData")).address.coordinates;
    const avoidPolygons = JSON.parse(localStorage.getItem("avoidPolygons"));
    const transportation = storedUser?.transportation;
    const orsProfile = getORSProfile(transportation);
    const orsApiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;

    if(!orsApiKey) {
      throw new Error("ORS API key is missing");
    }

    if (!userLocation) {
      throw new Error("User location is missing in localStorage");
    }

    console.log("Fire Polygons Collection:", JSON.stringify(firePolygonsCollection, null, 2));

    const requestBody = {
      coordinates: [
        [userLocation.lng, userLocation.lat], // User's current coords
        [destinationCoord.lng, destinationCoord.lat]    // Destination coords
      ],
      options: {
        avoid_polygons: avoidPolygons
      }
    };
  
    const url = `https://api.openrouteservice.org/v2/directions/${orsProfile}/geojson`;
    const response = await axios.post(url, requestBody, {
      headers: {
        "Authorization": orsApiKey,
        "Content-Type": "application/json"
      }
    });

    const routeFeature = response.data.features[0];
    return {
      eta: routeFeature.properties.summary.duration,
      distance: routeFeature.properties.summary.distance,
      geometry: routeFeature.geometry
    };
  } catch (error) {
    console.error("Error fetching safe route from ORS:", error.response?.data || error);
    return { eta: null, distance: null, geometry: null };
  }
};
