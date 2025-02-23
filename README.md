# Emergency Assistance App

The Emergency Assistance App is a Next.js–based platform designed to support users during emergencies (e.g., fire hazards) by providing targeted recommendations for essential amenities, safe travel routes, and real‐time mapping overlays. The application integrates multiple Google services (Gemini AI, Maps, Places, Directions, Dialogflow) and Firebase for authentication and data persistence, as well as external data sources like NASA's Landsat API.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Modules and Functions](#modules-and-functions)
  - [Gemini Service](#gemini-service)
  - [Map Overlay and Markers](#map-overlay-and-markers)
  - [Recommendations and Data Fetching](#recommendations-and-data-fetching)
  - [Dialogflow Integration](#dialogflow-integration)
  - [Firebase Services](#firebase-services)
  - [API Endpoints](#api-endpoints)
  - [Utilities](#utilities)
  - [Context Providers](#context-providers)
  - [UI Components](#ui-components)
- [Configuration Files](#configuration-files)
- [Usage](#usage)
- [License](#license)

---

## Overview

This project is built using Next.js and modern React tools. It assists users affected by emergencies by aggregating personalized recommendations, safe travel routes, and environmental hazard data on interactive maps. The app leverages generative AI to create content and explanations, offers real-time data from NASA and Google APIs, and integrates Firebase for user management. What makes our project unique is that it uses Gemini to smartly generate queries for google maps APIs, allowing for our project to chose the best amenities based on peoples needs. This allows people to put in dynamic or uncommon requests and our system will be able to adapt to them becauase Gemini will generate smart queries for it.

---

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Next.js API routes, Axios
- **AI & Mapping:** Google Generative AI (Gemini), Google Maps API, Google Places API, Google Directions, Dialogflow
- **Data & Authentication:** Firebase (Firestore & Auth)
- **External Data:** NASA Landsat API, OpenRouteService (ORS)
- **Utilities:** Turf.js for geospatial computations, axios for HTTP requests

---

## Directory Structure

```
/src
  /app
    /recommendations
      - map_overlay.js         // Renders Google Map overlays with fire polygons and custom markers.
      - gallery.js             // Gallery view for displaying recommended amenities with filtering/sorting.
      - page.js                // Recommendations page that ties together user data, maps, and galleries.
    /preferences               // Page to manage and update user emergency assistance preferences.
    /review                    // Page to generate and display user reviews based on their input.
    layout.js                 // Root layout wrapping the app with context providers (Auth & Notification).
    layout-server.js          // Server layout containing metadata (title, description).
    page.js                   // Main landing/login page with Firebase authentication.
  /components
    /ui
      - button.jsx             // Reusable button component with configurable style and size.
    - Notifications.jsx       // Component to show global notifications.
    - (Other UI components such as InfoCard, SortDropdown, FilterDropdown are used in gallery)
  /context
    - AuthContext.js          // Manages and provides authentication state (user, loading).
    - NotificationContext.jsx // Global notification provider with add/clear functions.
  /firebase
    - config.js               // Initializes Firebase using environment variables; exports db and auth.
    /services
      - firestore.js          // Provides Firestore functions (add, get, update user data, test connection).
      - auth.js               // Exposes authentication services (e.g., signInWithGoogle, signOut).
  /pages
    /api
      - landsat.js            // API endpoint fetching and converting Landsat CSV data from NASA to JSON.
      - generate-explanations.js // Uses Gemini to generate concise explanations for recommended places.
      - recommend-places.js   // Generates Google Maps Places API query URLs and retrieves recommendation data.
  /services
    - gemini.js               // Interacts with Google's Gemini API to generate content and chat responses.
    - dialogflow.js           // Initializes Dialogflow SessionsClient for chatbot integration.
  /utils
    - fetchRecommendations.js // Generates a detailed prompt and fetches recommendations; sorts amenities.
    - fetchSafeRouteORS.js    // Calls the ORS API to compute safe routes while avoiding fire polygons.
    - fetchRouteInfo.js       // Retrieves detailed route information from Google Maps Directions API.
    - extractPlacesQueriesUrls.js // Extracts URLs from Gemini's output and sends GET requests to the Places API.
    - decodeORSGeometry.js    // Decodes ORS LineString geometry data into map-friendly latitude/longitude coordinates.
  /lib
    - utils.js                // Helper function to merge CSS class names using clsx and tailwind-merge.
/jsconfig.json                 // Configures path aliases for easier module imports.
/.gitignore                    // Specifies files to ignore in version control.
/LICENSE                      // MIT License file.
/package.json                 // Project metadata, scripts, and dependencies.
/next.config.mjs              // Next.js configuration (headers, experimental options, webpack fallbacks).
```

---

## Modules and Functions

### Gemini Service

- **File:** `src/services/gemini.js`
- **Purpose:**  
  Provides two main functions to interact with Google's Generative AI (Gemini).
- **Functions:**
  - `generateContent(prompt)`  
    Sends a text prompt to the Gemini model and returns the generated content.
  - `generateChatContent(messages)`  
    Initiates a chat session with Gemini using a series of messages and returns an AI-generated response.

---

### Map Overlay and Markers

#### MapOverlay

- **File:** `src/app/recommendations/map_overlay.js`
- **Purpose:**  
  Renders an interactive Google Map displaying environmental overlays such as fire polygons (generated using Turf.js) and user-specific markers.
- **Key Features:**  
  - Uses the Google Maps JavaScript API to load and configure the map.
  - Automatically determines the map center based on Landsat data or the user's geolocation.
  - Adds event listeners to display walkability scores on mouse hover.
  - Implements toggling to show/hide the overlay for walkability data.

#### CustomMarker

- **File:** `src/app/recommendations/CustomMarker.js`
- **Purpose:**  
  Displays custom markers on the Google Map with visual cues based on data confidence.
- **Key Functions:**
  - `getColor(confidence)`  
    Returns a specific color (red, orange, yellow, etc.) based on the marker's confidence.
- **Additional Info:**  
  Shows a tooltip with details (confidence level, acquisition date, time) when hovered over.

---

### Recommendations and Data Fetching

#### Fetch Recommendations

- **File:** `src/utils/fetchRecommendations.js`
- **Purpose:**  
  Constructs a detailed review prompt describing the user's scenario and preferences to generate recommendations.
- **Functions:**
  - `sortAmenities(rawResults)` (internal helper)  
    Sorts the raw amenities ensuring at least three items per mandatory category (Healthcare, Shelter, Food/Water) with a maximum of 15 overall.

#### Gallery

- **File:** `src/app/recommendations/gallery.js`
- **Purpose:**  
  Displays the recommended amenities in a gallery format allowing users to sort and filter results.
- **Key Functions:**
  - `getFilterCategories(types)`  
    Converts raw Google Places API types into human-readable filter groups (Health, Food, Retail, Shelter, Civic, etc.).
- **Features:**  
  Enhances recommendations with dummy ETA and walkability scores, and supports dropdown-based filtering and sorting.

---

### Dialogflow Integration

- **File:** `src/services/dialogflow.js`
- **Purpose:**  
  Initializes the Dialogflow SessionsClient using project credentials for conversational interaction.
- **Usage:**  
  The client is used to integrate real-time chatbot functionality into the application.

---

### Firebase Services

#### Firestore Service

- **File:** `src/firebase/services/firestore.js`
- **Purpose:**  
  Provides methods to interact with Firestore for testing the connection and performing CRUD operations.
- **Key Functions:**
  - `getUserData(uid)`  
    Retrieves a user document based on a given UID.
  - `setUser(uid, userData)`  
    Creates or updates a user document with merging.
  - `updateUser(uid, data)`  
    Updates existing user data; logs and throws errors if the update fails.

#### Firebase Configuration

- **File:** `src/firebase/config.js`
- **Purpose:**  
  Initializes the Firebase application using environment variables and exports the Firestore database (`db`) and authentication service.

#### Authentication Service

- **File:** `src/firebase/services/auth.js`
- **Purpose:**  
  Handles user authentication methods such as signing in with Google and signing out.
- **Export:**  
  An `authService` instance is provided for use throughout the app.

---

### API Endpoints

#### Landsat API

- **File:** `src/pages/api/landsat.js`
- **Purpose:**  
  Fetches CSV data from NASA's MODAPS API for LANDSAT and converts it into JSON format, providing location and confidence data for mapping.

#### Generate Explanations API

- **File:** `src/pages/api/generate-explanations.js`
- **Purpose:**  
  Accepts a POST request containing a user review and place details, then constructs a prompt and leverages Gemini's `generateContent` function to generate a concise explanation for why a particular amenity was recommended.

#### Recommend Places API

- **File:** `src/pages/api/recommend-places.js`
- **Purpose:**  
  Processes a POST request with a review text to generate query URLs (using Gemini), extracts those URLs with a utility function, and sends multiple requests to the Google Places API. The endpoint then returns the aggregated results.

---

### Utilities

#### Fetch Safe Route

- **File:** `src/utils/fetchSafeRouteORS.js`
- **Purpose:**  
  Computes a safe driving route using the OpenRouteService API while avoiding areas (fire polygons) marked as unsafe.
- **Key Features:**  
  Constructs the request body with user location and avoidance polygons, then returns summary details like ETA, distance, and route geometry.

#### Fetch Route Information

- **File:** `src/utils/fetchRouteInfo.js`
- **Purpose:**  
  Retrieves detailed route information from the Google Maps Directions API based on user preferences and computed travel mode.
- **Flow:**  
  - Retrieves user preferences from Firestore.
  - Determines travel mode (driving, walking, transit, etc.).
  - Constructs a request payload and returns details such as ETA, distance, and encoded polyline.

#### Extract Places Query URLs

- **File:** `src/utils/extractPlacesQueriesUrls.js`
- **Purpose:**  
  Provides utility functions to extract URLs from Gemini's output and send multiple GET requests to the Google Places API.
- **Key Functions:**
  - `extractUrls(text)`  
    Uses a regular expression to extract all URL strings from a block of text.
  - `sendMultipleRequests(urls)`  
    Replaces the "YOUR_API_KEY" placeholder with the actual API key and sends concurrent GET requests, returning the response data.

#### Decode ORS Geometry

- **File:** `src/utils/decodeORSGeometry.js`
- **Purpose:**  
  Converts a LineString geometry from an ORS response into an array of coordinate objects with `lat` and `lng` properties for mapping.

---

### Context Providers

#### Notification Context

- **File:** `src/context/NotificationContext.jsx`
- **Purpose:**  
  Implements a global notifications system.
- **Key Functions:**
  - `addNotification(notification)`  
    Adds a new alert to the notifications list.
  - `clearNotifications()`  
    Clears all currently set notifications.

#### Authentication Context

- **File:** `src/context/AuthContext.js`
- **Purpose:**  
  Provides the authentication state (user data and loading status) throughout the application via the `useAuth()` hook.

---

### UI Components

#### Button Component

- **File:** `src/components/ui/button.jsx`
- **Purpose:**  
  A reusable, style-configurable button component.
- **Features:**  
  Uses Tailwind CSS along with class merging utilities (`clsx` and `twMerge`) to support various styles and sizes (default, small, large, icon).

#### Notifications Component

- **File:** `src/components/Notifications.jsx`
- **Purpose:**  
  Renders a list of global notifications using the Notification Context.

*Note:* Additional UI elements (e.g., InfoCard, SortDropdown, and FilterDropdown) are used within the gallery and preference pages to enhance user interaction.

---

## Configuration Files

- **package.json:**  
  Contains project metadata, dependency lists, and scripts for development, building, and starting the application.
- **next.config.mjs:**  
  Configures Next.js settings including custom headers (for CORS), experimental options, module transpilation, and webpack fallbacks.
- **jsconfig.json:**  
  Sets up module path aliases for cleaner import statements.
- **.gitignore:**  
  Lists files and folders excluded from version control (e.g., node_modules, env files).
- **LICENSE:**  
  The project is licensed under the MIT License.

---

## Usage

1. **Set Up Environment Variables:**  
   Ensure that you have configured environment variables for:
   - Firebase (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.)
   - Google services (e.g., `NEXT_PUBLIC_GEMINI_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, etc.)
   - Dialogflow credentials
   - OpenRouteService API key (`NEXT_PUBLIC_ORS_API_KEY`)
  
2. **Install Dependencies:**  
   Run:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. **Start the Development Server:**  
   Run:
   ```
   npm run dev
   ```
   Access the application at [http://localhost:3000](http://localhost:3000).

4. **Deploy:**  
   Follow Next.js deployment guidelines or deploy via the Vercel platform for production.

---

## License

This project is open source and licensed under the [MIT License](./LICENSE).

---

By providing comprehensive modular explanations and clear documentation of each function and module, this README serves as both an overview and a developer guide for the Emergency Assistance App codebase.
