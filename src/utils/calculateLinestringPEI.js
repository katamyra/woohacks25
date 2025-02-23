import * as turf from "@turf/turf";

/**
 * Calculate the weighted average PEI score along a linestring.
 * @param {Feature<LineString>} line - A GeoJSON LineString feature.
 * @param {FeatureCollection<Polygon>} polygons - A GeoJSON FeatureCollection of polygons with a PEI_score property.
 * @returns {number|null} The weighted average PEI score, or null if no segments intersect.
 */
export const calculateWeightedPEIScore = (line, polygons) => {
  let totalLength = 0;
  let weightedSum = 0;

  // Iterate through each polygon in the collection.
  polygons.features.forEach((polygon) => {
    const peiScore = polygon.properties?.PEI_score;
    if (peiScore === undefined) return; // Skip if there's no PEI score.

    // Get the overlapping segment between the line and the polygon.
    const overlap = turf.intersect(line, polygon);
    if (overlap) {
      // Compute the length of the overlapping segment.
      const segmentLength = turf.length(overlap, { units: "kilometers" });
      const segmentLengthMeters = segmentLength * 1000;
      weightedSum += segmentLengthMeters * peiScore;
      totalLength += segmentLengthMeters;
    }
  });

  // Return null if no part of the line intersects any polygon.
  if (totalLength === 0) return null;

  // Compute the weighted average PEI score.
  return weightedSum / totalLength;
};
