'use client';

import { useState } from 'react';
import { firestoreService } from '@/firebase/services/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Preferences() {
  const { user } = useAuth();
  const router = useRouter();
  const [transportation, setTransportation] = useState('walking');
  const [fitnessLevel, setFitnessLevel] = useState('regular');
  const [needs, setNeeds] = useState({
    food: false,
    shelter: false,
    medical: false,
    supplies: false
  });

  const [householdInfo, setHouseholdInfo] = useState({
    totalMembers: 1,
    infants: 0,
    children: 0,
    adults: 1,
    seniors: 0,
    pets: 0
  });

  const [medicalNeeds, setMedicalNeeds] = useState('');

  const [maxDistance, setMaxDistance] = useState(5); // in miles

  const [communicationPrefs, setCommunicationPrefs] = useState({
    phone: false,
    email: false,
    text: false,
    language: 'english'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNeedsChange = (event) => {
    setNeeds({
      ...needs,
      [event.target.name]: event.target.checked
    });
  };

  const handleHouseholdChange = (field, value) => {
    setHouseholdInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMedicalNeedsChange = (event) => {
    setMedicalNeeds(event.target.value);
  };

  const handleSubmit = async () => {
    if (!user) {
      setErrorMessage('You must be logged in to save preferences');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      await firestoreService.setUser(user.uid, {
        preferences: {
          transportation,
          fitnessLevel,
          needs,
          householdInfo,
          medicalNeeds,
          maxDistance,
          communicationPrefs
        }
      });
      const existingUser = JSON.parse(localStorage.getItem('user')) || {};
      existingUser.transportation = transportation;
      
      localStorage.setItem('user', JSON.stringify({
        ...existingUser, 
      }));
      // Redirect to review page after successful save
      router.push('/review');
    } catch (error) {
      setErrorMessage('Failed to save preferences: ' + error.message);
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-4xl text-center mb-8 text-white">Emergency Assistance Preferences</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Basic Needs Card */}
          <div className="card bg-gray-900/50 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-gray-100">Basic Needs</h2>
              <div className="form-control">
                {['food', 'shelter', 'medical', 'miscellaneous supplies'].map((need) => (
                  <label key={need} className="label cursor-pointer">
                    <span className="label-text text-gray-300 capitalize">{need}</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary bg-gray-700"
                      checked={needs[need]}
                      onChange={handleNeedsChange}
                      name={need}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Transportation Card */}
          <div className="card bg-gray-900/50 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-gray-100">Transportation</h2>
              <select 
                className="select select-bordered w-full bg-gray-700 text-gray-100 border-gray-600"
                value={transportation}
                onChange={(e) => setTransportation(e.target.value)}
              >
                <option value="walking">Walking</option>
                <option value="bicycle">Bicycle</option>
                <option value="driving">Driving</option>
                <option value="public">Public Transport</option>
              </select>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-300">
                    Maximum Travel Distance: {maxDistance} miles
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className="range range-primary"
                  step="1"
                />
                <div className="w-full flex justify-between text-xs px-2 text-gray-400">
                  <span>1mi</span>
                  <span>25mi</span>
                  <span>50mi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Household Information Card */}
          <div className="card bg-gray-900/50 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-gray-100">Household Information</h2>
              <div className="grid grid-cols-2 gap-2">
                {['adults', 'children', 'infants', 'seniors', 'pets'].map((field) => (
                  <div key={field} className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-300 capitalize">{field}</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full bg-gray-700 text-gray-100 border-gray-600"
                      value={householdInfo[field]}
                      onChange={(e) => handleHouseholdChange(field, parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Medical Needs Card */}
          <div className="card bg-gray-900/50 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-gray-100">Medical & Special Needs</h2>
              <textarea
                className="textarea textarea-bordered h-32 bg-gray-700 text-gray-100 border-gray-600"
                value={medicalNeeds}
                onChange={handleMedicalNeedsChange}
                placeholder="Please describe any medical conditions, medications, mobility issues, or special dietary needs..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button 
            className="btn btn-primary mt-8 px-8 py-3 text-lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Next'}
          </button>
          {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
        </div>

        {/* ChatInterface removed (now rendered globally) */}
      </div>
    </div>
  );
}
