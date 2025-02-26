"use client";
import * as turf from "@turf/turf";

// Demo user coordinates
export const DEMO_USER_COORDS = {
  lat: 33.7756178,
  lng: -84.39628499999999,
};

// Dummy fire 1km EAST of DEMO_USER_COORDS
export const DEMO_FIRE_CENTER_COORDS = {
  lat: DEMO_USER_COORDS.lat,
  lng: DEMO_USER_COORDS.lng + 0.01191,
};

// Create a polygon with a 0.75km radius around the demo fire center
export function getDemoFirePolygon() {
  const point = turf.point([DEMO_FIRE_CENTER_COORDS.lng, DEMO_FIRE_CENTER_COORDS.lat]);
  const buffered = turf.buffer(point, 0.75, { units: "kilometers" });
  return buffered.geometry.coordinates;
}
