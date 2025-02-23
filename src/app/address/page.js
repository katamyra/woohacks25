"use client"
import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/firebase/services/firestore';
import { useRouter } from 'next/navigation';

export default function AddressPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState(null); // Initialize with null

    // Use effect to set the initial location to the user's current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });
                },
                () => {
                    alert('Unable to retrieve your location');
                    // Fallback to a default location if geolocation fails
                    setLocation({ lat: 37.7749, lng: -122.4194 }); // San Francisco
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
            // Fallback to a default location
            setLocation({ lat: 37.7749, lng: -122.4194 }); // San Francisco
        }
    }, []);

    const handleAddressChange = (event) => {
        setAddress(event.target.value);
    };

    const handleApply = async () => {
        // Geocode the address to get latitude and longitude
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
            await firestoreService.setUser(user.uid, {
                address: {
                    formatted: address,
                    coordinates: {
                        lat: location.lat,
                        lng: location.lng
                    },
                    lastUpdated: new Date().toISOString()
                }
            });
            router.push('/preferences');
        } catch (error) {
            alert('Error saving address: ' + error.message);
        }
    };

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    });

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-1/2 p-4 bg-gray-800 text-white shadow-lg">
                <h2 className="text-2xl bg-gray-800 font-bold mb-4">Enter Address</h2>
                <input
                    type="text"
                    placeholder="Address"
                    className="input input-bordered w-full mb-4 bg-gray-700 text-white"
                    value={address}
                    onChange={handleAddressChange}
                />
                <button
                    className="btn w-full mb-4"
                    style={{ backgroundColor: '#176BEF', color: 'white' }}
                    onClick={handleApply}
                >
                    Apply
                </button>
                <button
                    className="btn w-full mb-4"
                    style={{ backgroundColor: '#FF3E30', color: 'white' }}
                    onClick={handleUseCurrentLocation}
                >
                    Use My Current Location
                </button>
                <button
                    className="btn w-full"
                    style={{ backgroundColor: '#179C52', color: 'white' }}
                    onClick={handleSubmit}
                >
                    Save & Continue
                </button>
            </div>
            {isLoaded && location && (
                <div className="w-1/2">
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
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