import axios from 'axios';

//Extract all Url's from text
export function extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
}

//Sends multiple GET requests with an array of Url query strings
export async function sendMultipleRequests(urls) {
    const placesApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const validUrls = urls.map((url) =>
        url.replace("realAPIKey", placesApiKey)  // Replace the placeholder
    );
    const requests = validUrls.map((url) => axios.get(url));
  const responses = await Promise.all(requests);
  return responses.map((response) => response.data);
}
