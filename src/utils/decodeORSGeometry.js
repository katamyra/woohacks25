export const decodeORSGeometry = (geometry) => {
  if (geometry && geometry.type === "LineString") {
    return geometry.coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1]
    }));
  }
  return [];
}; 