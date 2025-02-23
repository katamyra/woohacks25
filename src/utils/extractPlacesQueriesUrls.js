// utils/extractPlacesQueriesUrls.js
import { buildNearbySearchUrl } from './urlBuilder';

export function extractPlacesQueriesUrls({ lat, lng }) {
  const location = `${lat},${lng}`;
  const radius = 52800; // e.g., 33 miles (52800 meters)
  const queries = [
    { type: 'hospital', keyword: 'urgent care OR medical clinic' },
    { type: 'lodging', keyword: 'homeless shelter OR evacuation center' },
    { type: 'food', keyword: 'food bank OR soup kitchen OR water station' },
    { type: 'pharmacy', keyword: 'pharmacy' },
    { type: 'grocery_or_supermarket', keyword: 'grocery store OR supermarket' },
    { type: 'clothing_store', keyword: 'clothing store' },
    { type: 'transit_station', keyword: 'bus station OR train station' },
  ];

  // Build a URL for each query using the helper.
  const urls = queries.map(query =>
    buildNearbySearchUrl({
      location,
      radius,
      type: query.type,
      keyword: query.keyword,
    })
  );

  return urls;
}
