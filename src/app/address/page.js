"use client"
import { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

export default function AddressPage() {
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco

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

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-1/3 p-4 bg-black text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Enter Address</h2>
                <input
                    type="text"
                    placeholder="Address"
                    className="input input-bordered w-full mb-4"
                    value={address}
                    onChange={handleAddressChange}
                />
                <button className="btn btn-primary w-full" onClick={handleApply}>
                    Apply
                </button>
            </div>
            <div className="flex-grow">
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