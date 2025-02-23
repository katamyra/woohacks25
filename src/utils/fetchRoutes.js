import axios from "axios";

export const fetchRouteInfo = async (origin, destination) => {
  try {
    // Construct the request body as specified by the computeRoutes method
    const requestBody = {
      origin: { location: { latitude: origin.lat, longitude: origin.lng } },
      destination: { location: { latitude: destination.lat, longitude: destination.lng } },
      routingPreference: "TRAFFIC_AWARE_OPTIMAL",
    };

    // Make a POST request including the required field mask header
    const response = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        },
      }
    );

    // Extract the first (or primary) route information from the response.
    const primaryRoute = response.data.routes && response.data.routes[0];

    // Assume the API returns duration (as a string, e.g., "3.5s") and distanceMeters.
    return {
      eta: primaryRoute ? primaryRoute.duration : null,
      distance: primaryRoute ? primaryRoute.distanceMeters : null,
    };
  } catch (error) {
    console.error("Error fetching route info:", error);
    return { eta: null, distance: null };
  }
};