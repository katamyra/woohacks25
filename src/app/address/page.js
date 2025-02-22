"use client"
import { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/firebase/services/firestore';
import { useRouter } from 'next/navigation';

export default function AddressPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        useCurrentLocation: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco

    const handleChange = (e) => {
        setAddress(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleCheckboxChange = (e) => {
        setAddress(prev => ({
            ...prev,
            useCurrentLocation: e.target.checked
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('You must be logged in to save address');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await firestoreService.setUser(user.uid, { address });
            router.push('/preferences');
        } catch (error) {
            setError('Error saving address: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddressChange = (event) => {
        // Geocode the address to get latitude and longitude
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: event.target.value }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const { lat, lng } = results[0].geometry.location;
                setLocation({ lat: lat(), lng: lng() });
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
            <div className="container mx-auto max-w-md">
                <h1 className="text-4xl text-center mb-8">Enter Your Address</h1>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Street Address</span>
                        </label>
                        <input
                            type="text"
                            name="street"
                            className="input input-bordered bg-gray-800 text-white"
                            value={address.street}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">City</span>
                        </label>
                        <input
                            type="text"
                            name="city"
                            className="input input-bordered bg-gray-800 text-white"
                            value={address.city}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">State</span>
                        </label>
                        <input
                            type="text"
                            name="state"
                            className="input input-bordered bg-gray-800 text-white"
                            value={address.state}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">ZIP Code</span>
                        </label>
                        <input
                            type="text"
                            name="zip"
                            className="input input-bordered bg-gray-800 text-white"
                            value={address.zip}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label cursor-pointer">
                            <span className="label-text">Use Current Location</span>
                            <input
                                type="checkbox"
                                className="checkbox checkbox-primary"
                                checked={address.useCurrentLocation}
                                onChange={handleCheckboxChange}
                            />
                        </label>
                    </div>

                    {error && <div className="text-red-500 text-center">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save & Continue'}
                    </button>
                </form>
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