// In utils/fetchRouteInfo.js

import axios from "axios";
import { firestoreService } from "@/firebase/services/firestore";
import * as turf from "@turf/turf";
import { DEMO_USER_COORDS } from "@/utils/demoFire";

export const fetchRouteInfo = async (
  origin,
  destination,
  safeWaypoints,
  user,
  firePolygons
) => {
  try {
    if (!user || !user.uid) {
      throw new Error("User is not defined or missing uid");
    }

    const userData = await firestoreService.getUserData(user.uid);
    if (!userData) {
      throw new Error("No user data found");
    }

    // Use a fallback if transportation preference is missing.
    const transportPreference =
      userData.preferences && userData.preferences.transportation
        ? userData.preferences.transportation
        : "driving";

    // Use demo user coordinates if demo fire is True
    const useDemo = localStorage.getItem("useDemoFire") === "true";
    if (useDemo) {
      origin = DEMO_USER_COORDS;
    }

    const getTravelMode = (preference) => {
      switch (preference) {
        case "public":
          return "TRANSIT";
        case "walking":
          return "WALK";
        case "driving":
          return "DRIVE";
        case "biking":
          return "BICYCLE";
        default:
          return "DRIVE";
      }
    };

    const dynamicTravelMode = getTravelMode(transportPreference);

    // Validate origin and destination coordinates.
    if (
      !origin ||
      typeof origin.lat !== "number" ||
      typeof origin.lng !== "number"
    ) {
      throw new Error("Invalid origin coordinates");
    }
    if (
      !destination ||
      typeof destination.lat !== "number" ||
      typeof destination.lng !== "number"
    ) {
      throw new Error("Invalid destination coordinates");
    }

    // For ComputeRoutes, each waypoint (origin, destination, intermediate) must be an object with:
    // { location: { latLng: { latitude: <number>, longitude: <number> } } }
    const requestBody = {
      origin: {
        location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
      },
      destination: {
        location: {
          latLng: { latitude: destination.lat, longitude: destination.lng },
        },
      },
      travelMode: dynamicTravelMode,
    };

    // Only set routingPreference if travelMode is DRIVE or TWO_WHEELER
    if (dynamicTravelMode === "DRIVE" || dynamicTravelMode === "TWO_WHEELER") {
      requestBody.routingPreference = "TRAFFIC_AWARE";
    }

    // If a safeWaypoint is provided, add it as an intermediate waypoint.
    const safeWaypointsArray = [];

    // Map safeWaypoints to the expected format if any safe points exist:
    if (safeWaypointsArray.length > 0) {
      requestBody.intermediates = safeWaypointsArray.map((point) => ({
        location: { latLng: { latitude: point.lat, longitude: point.lng } },
      }));
    }

    // Log the payload to help with debugging.
    console.log(
      "ComputeRoutes Request Payload:",
      JSON.stringify(requestBody, null, 2)
    );

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("API key is missing");
    }
    const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${apiKey}`;

    const response = await axios.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
    });

    const primaryRoute = response.data.routes && response.data.routes[0];

    return {
      eta: primaryRoute ? primaryRoute.duration : null,
      distance: primaryRoute ? primaryRoute.distanceMeters : null,
      encodedPolyline: primaryRoute
        ? primaryRoute.polyline.encodedPolyline
        : null,
    };
  } catch (error) {
    console.error("Error fetching route info:", error);
    return { eta: null, distance: null, encodedPolyline: null };
  }
};
