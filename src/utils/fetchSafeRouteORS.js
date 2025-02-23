// fetchSafeRouteORS.js
import axios from 'axios';


export const fetchSafeRouteORS = async (origin, destination, firePolygonsCollection, userLocation) => {
  try {
    const orsApiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
    if (!orsApiKey) {
      throw new Error("ORS API key is missing");
    }

    console.log("Fire Polygons Collection:", JSON.stringify(firePolygonsCollection, null, 2));

    const requestBody = {
      coordinates: [
        [userLocation.lng, userLocation.lat], // Georgia State Capitol
        [-83.3773, 33.9480]  // UGA
      ]
      ,
      options: {
        avoid_polygons: firePolygonsCollection
      }
    }
    // console.log(JSON.stringify(requestBody, null, 2)); // Log the request body

    const url = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;

    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: orsApiKey,
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