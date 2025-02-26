"use client";

import { useState, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useAuth } from "@/context/AuthContext";
import { firestoreService } from "@/firebase/services/firestore";
import { useRouter } from "next/navigation";

export default function AddressPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  // Initially set location using browser geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
        },
        () => {
          alert("Unable to retrieve your location");
          // Fallback to College of Wooster if geolocation fails
          setLocation({ lat: 40.8117, lng: -81.9308 });
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setLocation({ lat: 40.8117, lng: -81.9308 });
    }
  }, []);

  // Reverse geocode the current location to autofill address upon API first load
  useEffect(() => {
    if (isLoaded && location && address === "") {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location }, (results, status) => {
        if (status === "OK" && results[0]) {
          setAddress(results[0].formatted_address);
        } else {
          alert("Geocode was not successful for the following reason: " + status);
        }
      });
    }
  }, [isLoaded, location, address]);

  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  // Trigger geocoding when the user presses Enter and enters the address
  const handleApply = () => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        setLocation({ lat: lat(), lng: lng() });
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === "OK" && results[0]) {
              setAddress(results[0].formatted_address);
            } else {
              alert("Geocode was not successful for the following reason: " + status);
            }
          });
        },
        () => {
          alert("Unable to retrieve your location");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Update coordinates upon saving the address.
  // Re-geocoding is done here so that if the user manually enters an address,
  // its coordinates are used instead of the initial geolocation.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to save address");
      return;
    }

    // Re-geocode the inputted address to ensure coordinates match the entered address.
    // If geocoding fails, fallback to College of Wooster coordinates.
    let newLocation = location; // Fallback to current location if needed
    const geocoder = new window.google.maps.Geocoder();
    try {
      const geocodeResult = await new Promise((resolve) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results[0]) {
            const { lat, lng } = results[0].geometry.location;
            resolve({ lat: lat(), lng: lng() });
          } else {
            // Fallback to College of Wooster coordinates
            resolve({ lat: 40.8117, lng: -81.9308 });
          }
        });
      });
      newLocation = geocodeResult;
      // Update state so the map reflects the new location
      setLocation(newLocation);
    } catch (error) {
      // In case of any unexpected error, fallback to College of Wooster coordinates.
      alert("Unexpected geocoding error: " + error + ". Falling back to College of Wooster.");
      newLocation = { lat: 40.8117, lng: -81.9308 };
      setLocation(newLocation);
    }

    // Build data to store using the newly obtained coordinates (from the manual address)
    const updatedUserData = {
      uid: user.uid,
      address: {
        formatted: address,
        coordinates: newLocation,
        lastUpdated: new Date().toISOString(),
      },
    };

    try {
      await firestoreService.setUser(user.uid, updatedUserData);
      localStorage.setItem("userData", JSON.stringify(updatedUserData));
      localStorage.setItem("address", address);
      router.push("/preferences");
    } catch (error) {
      alert("Error saving address: " + error.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-79.65">
      <div className="w-full md:w-1/2 p-4 bg-gray-800 text-white shadow-lg">
        <h2 className="text-2xl bg-gray-800 font-bold mb-4">Enter Address</h2>
        <input
          type="text"
          placeholder="Address"
          className="input input-bordered w-full mb-4 bg-gray-700 text-white"
          value={address}
          onChange={handleAddressChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApply();
          }}
        />
        <button
          className="btn w-full mb-4"
          style={{ backgroundColor: "#00A1F1", color: "white" }}
          onClick={handleUseCurrentLocation}
        >
          Use My Current Location
        </button>
        <button
          className="btn w-full"
          style={{ backgroundColor: "#7CBB00", color: "white" }}
          onClick={handleSubmit}
        >
          Save & Continue
        </button>
      </div>
      {isLoaded && location && (
        <div className="w-full md:w-1/2 h-96 md:h-full">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={location}
            zoom={14}
          >
            <Marker position={location} />
          </GoogleMap>
        </div>
      )}
    </div>
  );
}
