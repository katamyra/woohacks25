export const fetchRecommendations = async (review, { address, lng, lat }) => {
    const reviewText = `Below is a summary about various pieces of information about a person(s) who is in a disaster survival scenario. 
    They are displaced due to a fire hazard. Your task is to generate a query to be sent to Google Maps API for several useful amenities personalized 
    to this person's needs, such as medical attention, resources, and shelter, as well as whatever preferences they have, as described by the summary below.
    Consequently, the query you send to Google Maps API should return 12-24 applicable amenities. Again, it is important that this query is tailored to
    the specific needs of the person the summary is describing, including factoring in mode choice, distance to the amenity, fitness level and age and injury status,
    maximum desired travel distance, medication needed and special needs to take into consideration which amenities to query for. 
    Note: An example of this would be including stores providing diapers and baby formula if it is indicated that the user is accompanied by infants.
    Note: In addition to personalized recommendations, include generally-applicable amenities as well, such as shelters, food sources, water sources, medical facilities,
    etc.
    Note: Include amenities regardless of their "Open now" status.

    Following the above guidelines, also include a minimum of 3 amenities of each of the following categories:
    "Healthcare" (which includes things like urgent care, hospitals, doctors, etc. NOT INCLUDING VETERINARIANS), "shelter", "food/water". 
    According to the amenities you think should also be included based on the user's background, add additional categories as needed.

    Additionally, include only amenities that are 

    User location: Longitude: ${lng}, Latitude: ${lat}.
    
    Summary of user(s):
    ${review}

    Google Maps Platform "Places API" query-building specifications:
    WARNING: Choose from these types:
        accounting
        airport
        atm
        bakery
        bank
        bicycle_store
        book_store
        bus_station
        cafe
        car_dealer
        car_rental
        car_repair
        car_wash
        casino
        cemetery
        church
        city_hall
        clothing_store
        convenience_store
        courthouse
        department_store
        doctor
        drugstore
        electrician
        electronics_store
        embassy
        fire_station
        funeral_home
        furniture_store
        gas_station
        hair_care
        hardware_store
        hindu_temple
        home_goods_store
        hospital
        insurance_agency
        jewelry_store
        laundry
        lawyer
        light_rail_station
        local_government_office
        locksmith
        lodging
        meal_delivery
        meal_takeaway
        mosque
        moving_company
        park
        parking
        pet_store
        pharmacy
        physiotherapist
        plumber
        police
        post_office
        primary_school
        real_estate_agency
        restaurant
        rv_park
        school
        secondary_school
        shoe_store
        shopping_mall
        stadium
        storage
        store
        subway_station
        supermarket
        synagogue
        taxi_stand
        train_station
        transit_station
        travel_agency
        university
        veterinary_care
    WARNING: Use "radius", DO NOT USE "rankby=distance"
    WARNING: You can only query one "type={PLACETYPE}" at once; for multiple PLACETYPEs, generate multiple queries URL's
    WARNING: For multiple keywords, put "+OR+" in between each keyword set instead of "|"; example: &keyword=urgent+care+OR+medical+clinic+OR+homeless+shelter+OR+food+bank
    FORMAT:
    ==================
    https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=realAPIKey&location={LATITUDE},{LONGITUDE}&radius={RADIUS_IN_METERS}&type={PLACE_TYPE}&keyword={SEARCH_KEYWORD}
    ==================
    `;
    console.log('Sending review text:', reviewText);

    try {
        const response = await fetch('/api/recommend-places', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ review: reviewText }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error('Failed to fetch Places API query');
        }

        const data = await response.json();
        const flattenedResults = data.results.flatMap(queryResult => queryResult.results || []);
        console.log('Received recommendations (flattened):', flattenedResults);
        return flattenedResults;
    } catch (error) {
        console.error('Error fetching Places API query:', error);
        throw error;
    }
}; 