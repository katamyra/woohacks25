export const fetchRecommendations = async (review, address, lng, lat) => {
    const reviewText = `${review} And your current location is ${address} and the lng and lat is ${lng} and ${lat}.
    please return the latitude and longitude of 30 recommended places in a comma separated list.`;
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