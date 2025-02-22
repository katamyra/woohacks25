export const fetchRecommendations = async (review, address, lng, lat) => {
    const reviewText = `Below is a summary about various pieces of information about a person(s) who is in a disaster survival scenario. 
    They are displaced due to a fire hazard. Your task is to generate a query to be sent to Google Maps API for several useful amenities personalized 
    to this person's needs, such as medical attention, resources, and shelter, as well as whatever preferences they have, as described by the summary below.
    Consequently, the query you send to Google Maps API should return 12-24 applicable amenities. Again, it is important that this query is tailored to
    the specific needs of the person the summary is describing, including factoring in mode choice, distance to the amenity, fitness level and age and injury status,
    maximum desired travel distance, medication needed and special needs to take into consideration which amenities to query for. 
    Note: An example of this would be including stores providing diapers and baby formula if it is indicated that the user is accompanied by infants.
    Note: In addition to personalized recommendations, include generally-applicable amenities as well, such as shelters, food sources, water sources, medical facilities,
    etc.

    Longitude: ${lng}, Latitude: ${lat}.
    
    Summary of user(s):
    ${review}
    
    Query-building specifications:
    
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
            throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        console.log('Received data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
    }
}; 