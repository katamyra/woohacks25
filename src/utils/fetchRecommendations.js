export const fetchRecommendations = async (review, { address, lng, lat }) => {
    const reviewText = `
      Below is a summary of a user in a disaster survival scenario. They have been displaced due to a fire hazard 
      and need personalized recommendations for essential amenities. Based on the information provided, your task 
      is to generate one or more Google Maps Places API query URLs that—when combined—return a maximum of 15 unique 
      amenities. Each query URL must target only one place type at a time.
  
      Requirements:
          Personalization:
              Tailor the queries to the user’s specific needs, taking into account factors such as mode of transportation, travel distance, fitness level, age, injury status, medication needs, and any special considerations.
  
          Mandatory Categories:
              Include at least 3 amenities for each of these categories:
                  Healthcare: (e.g., urgent care, hospitals, doctors)
                  Shelter
                  Food/Water
  
          Total Limit:
              The combined queries should yield no more than 15 total amenities.
  
          User Data:
              Location:
                  Longitude: ${lng}
                  Latitude: ${lat}
  
      User Summary:
      ${review}
  
      Google Maps Places API Query Guidelines:
          Place Types:
              Select from the following list (you may choose one per query):
              accounting, airport, atm, bakery, bank, bicycle_store, bus_station, cafe, car_dealer, 
              car_rental, car_repair, city_hall, clothing_store, convenience_store, department_store, 
              doctor, drugstore, electrician, electronics_store, embassy, fire_station, furniture_store, 
              hardware_store, home_goods_store, insurance_agency, laundry, lawyer, light_rail_station, 
              local_government_office, locksmith, lodging, meal_delivery, meal_takeaway, moving_company, 
              park, parking, pet_store, pharmacy, physiotherapist, police, post_office, primary_school, 
              real_estate_agency, restaurant, rv_park, school, gas_station, secondary_school, shoe_store, 
              shopping_mall, stadium, storage, store, subway_station, supermarket, taxi_stand, train_station, 
              transit_station, travel_agency, university, veterinary_care
          Query Parameters:
              Use radius (do not use rankby=distance).
              For multiple keywords in a single query, join them with +OR+ (e.g., &keyword=urgent+care+OR+medical+clinic+OR+homeless+shelter+OR+food+bank).
          URL Format:
              Use the following template for each query URL:
          https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=YOUR_API_KEY&location={LATITUDE},{LONGITUDE}&radius={RADIUS_IN_METERS}&type={PLACE_TYPE}&keyword={SEARCH_KEYWORD}
          Important: The string "YOUR_API_KEY" must remain unchanged as the placeholder.
  
      Your Task:
      Using the guidelines above, generate the necessary query URLs so that the final combined result set from the Google Maps API 
      will include a maximum of 15 amenities, covering all required categories and any additional relevant categories based on the 
      user's background.
    `;
  
    console.log('Sending review text:', reviewText);
  
    try {
      const response = await fetch('/api/recommend-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: reviewText }),
      });
  
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch Places API query');
      }
  
      const data = await response.json();
      const rawResults = data.results.flatMap(queryResult => queryResult.results || []);
  
      // Use our sorting function to select exactly 15 amenities
      const finalResults = sortAmenities(rawResults);
      console.log('Sorted recommendations (15 amenities):', finalResults);
      return finalResults;
    } catch (error) {
      console.error('Error fetching Places API query:', error);
      throw error;
    }
  };
  
  // Sorting function to gather at least 3 amenities per mandatory category and fill to 15 total.
  const sortAmenities = (rawResults) => {
    // Define which types count toward each category
    const healthcareTypes = new Set(["doctor", "hospital", "pharmacy", "drugstore", "physiotherapist"]);
    const foodTypes = new Set(["restaurant", "cafe", "bakery", "meal_delivery", "meal_takeaway", "convenience_store", "supermarket"]);
    const shelterTypes = new Set(["lodging", "shelter"]);
  
    const healthcare = [];
    const food = [];
    const shelter = [];
    const misc = [];
  
    // Categorize each raw result based on its 'types' array.
    for (const place of rawResults) {
      const types = place.types || [];
      let categorized = false;
      if (types.some(t => healthcareTypes.has(t))) {
        healthcare.push(place);
        categorized = true;
      }
      if (types.some(t => foodTypes.has(t))) {
        food.push(place);
        categorized = true;
      }
      if (types.some(t => shelterTypes.has(t))) {
        shelter.push(place);
        categorized = true;
      }
      if (!categorized) {
        misc.push(place);
      }
    }
  
    const selected = [];
    // Select the first three amenities from each required category.
    selected.push(...healthcare.slice(0, 3));
    selected.push(...food.slice(0, 3));
    selected.push(...shelter.slice(0, 3));
  
    // Create a pool of remaining amenities from any category.
    const remaining = [
      ...healthcare.slice(3),
      ...food.slice(3),
      ...shelter.slice(3),
      ...misc
    ];
  
    // Fill in the rest until we reach 15 total.
    const needed = 15 - selected.length;
    selected.push(...remaining.slice(0, needed));
  
    return selected;
  };
  