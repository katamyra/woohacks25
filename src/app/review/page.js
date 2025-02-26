'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/firebase/services/firestore';
import { generateContent } from '@/services/gemini';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Review() {
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [aiReview, setAiReview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [lastAdditionalInfo, setLastAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const data = await firestoreService.getUserData(user.uid);
          setUserData(data);
          if (data?.preferences) {
            await generateReview(data.preferences);
          }
        } catch (error) {
          setError('Error fetching user data: ' + error.message);
        }
      }
    };
    
    fetchUserData();
  }, [user]);

  const generateReview = async (preferences) => {
    setIsGenerating(true);
    setError('');

    try {
      const prompt = `Based on the following user preferences, provide a brief review of their conditions:
        - Transportation: ${preferences.transportation}
        - Fitness Level: ${preferences.fitnessLevel}
        - Max Distance: ${preferences.maxDistance} miles
        - Household Members: ${Object.entries(preferences.householdInfo)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')}
        - Medical Needs: ${preferences.medicalNeeds || 'None specified'}
        - Basic Needs: ${Object.entries(preferences.needs)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(', ')}
        ${additionalInfo ? `\nAdditional Information: ${additionalInfo}` : ''}
        Generate this review in paragraph format. At the end of the review, ask the user if they would like to add any more information.`;

      const result = await generateContent(prompt);
      setAiReview(result);
      setLastAdditionalInfo(additionalInfo);
      return result;
    } catch (error) {
      setError('Error generating review: ' + error.message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveReview = async () => {
    if (!user) {
      setError('You must be logged in to save review');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let reviewToSave = aiReview;
      if (additionalInfo !== lastAdditionalInfo) {
        reviewToSave = await generateReview(userData.preferences);
      }
      const fullReview = `${reviewToSave}\n\nAdditional Notes: ${additionalInfo}`;
      
      await firestoreService.setUser(user.uid, {
        review: fullReview,
        preferences: userData?.preferences,
        lastUpdated: new Date().toISOString()
      });
      
      router.push('/recommendations');
    } catch (error) {
      setError('Failed to save review: ' + error.message);
      setIsSubmitting(false);
    }
  };

  const handleAdditionalInfoChange = (e) => {
    setAdditionalInfo(e.target.value);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Please sign in to view your review</h1>
          <Link href="/" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col h-screen">
      <h1 className="text-4xl text-center mb-8">Your AI Review</h1>
      
      <div className="flex-1 overflow-y-auto pb-4">
        <div className="grid gap-6">
          {isGenerating ? (
            <div className="text-center">
              <div className="loading loading-spinner loading-lg"></div>
              <p className="mt-4">Generating your personalized review...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : !userData?.preferences ? (
            <div className="text-center text-gray-400">
              No preferences found. Please complete your preferences first.
            </div>
          ) : (
            <>
              <div className="card bg-gray-800/50 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4">AI Review</h2>
                  <div className="prose prose-invert">
                    <pre className="whitespace-pre-wrap">{aiReview}</pre>
                  </div>
                </div>
              </div>

              <div className="card bg-gray-800/50 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title mb-4">Additional Information</h2>
                  <textarea
                    className="textarea textarea-bordered w-full h-32 bg-gray-700 text-white"
                    placeholder="Add any additional information you'd like to include in your review..."
                    value={additionalInfo}
                    onChange={handleAdditionalInfoChange}
                  />
                  <div className="flex justify-start mt-4">
                    <button 
                      className="btn btn-primary"
                      onClick={handleSaveReview}
                      disabled={isSubmitting || !aiReview}
                    >
                      {isSubmitting ? 'Saving...' : 'Save & Continue'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
