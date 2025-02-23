"use client"
<<<<<<< Updated upstream
import { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
=======
import { useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/firebase/services/firestore';
import { useRouter } from 'next/navigation';

export default function AddressPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [address, setAddress] = useState('');
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco
=======
=======
>>>>>>> Stashed changes
    const [location, setLocation] = useState(null);

    // Get the Google Maps API loaded
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    });

    // On mount, set the initial location via geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
            setLocation({ lat: 40.8117, lng: 81.9308 });
        }
    }, []);
>>>>>>> Stashed changes

    // Once Google Maps API is loaded and location is set, reverse geocode to autofill address
    useEffect(() => {
        if (isLoaded && location && address === '') {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    setAddress(results[0].formatted_address);
                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            });
        }
    }, [isLoaded, location, address]);

    // Once Google Maps API is loaded and location is set, reverse geocode to autofill address
    useEffect(() => {
        if (isLoaded && location && address === '') {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    setAddress(results[0].formatted_address);
                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            });
        }
    }, [isLoaded, location, address]);

    const handleAddressChange = (event) => {
        setAddress(event.target.value);
    };

    // Called when the user presses Enter in the address input field
    const handleApply = () => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const { lat, lng } = results[0].geometry.location;
                setLocation({ lat: lat(), lng: lng() });
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
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
                    const latlng = { lat: latitude, lng: longitude };
                    geocoder.geocode({ location: latlng }, (results, status) => {
                        if (status === 'OK' && results[0]) {
                            setAddress(results[0].formatted_address);
                        } else {
                            alert('Geocode was not successful for the following reason: ' + status);
                        }
                    });
                },
                () => {
                    alert('Unable to retrieve your location');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('You must be logged in to save address');
            return;
        }

        try {
            await firestoreService.setUser(user.uid, { address });
            router.push('/preferences');
        } catch (error) {
            alert('Error saving address: ' + error.message);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-1/2 p-4 bg-black text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Enter Address</h2>
                <input
                    type="text"
                    placeholder="Address"
                    className="input input-bordered w-full mb-4"
                    value={address}
                    onChange={handleAddressChange}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
                />
                <button
                    className="btn w-full mb-4"
                    style={{ backgroundColor: '#00A1F1', color: 'white' }}
                    onClick={handleUseCurrentLocation}
                >
                    Use My Current Location
                </button>
                <button
                    className="btn w-full"
                    style={{ backgroundColor: '#7CBB00', color: 'white' }}
                    onClick={handleSubmit}
                >
                    Save & Continue
                </button>
            </div>
            <div className="w-1/2">
                <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={location}
                        zoom={14}
                    >
                        <Marker position={location} />
                    </GoogleMap>
                </LoadScript>
            </div>
        </div>
    );
}
