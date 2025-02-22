'use client';

import { firestoreService } from '../firebase/services/firestore';
import { authService } from '../firebase/services/auth';
import { useState, useEffect } from 'react';

export default function Home() {
  const [testResult, setTestResult] = useState('');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.uid) {
        try {
          const data = await firestoreService.getUserData(user.uid);
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    
    fetchUserData();
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      const userResult = await authService.signInWithGoogle();
      setUser(userResult);
      setTestResult(`✅ Signed in as ${userResult.displayName}`);
    } catch (error) {
      setTestResult(`❌ Sign in failed: ${error.message}`);
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setTestResult('✅ Signed out successfully');
    } catch (error) {
      setTestResult(`❌ Sign out failed: ${error.message}`);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl font-bold">User Profile</h1>
      
      <div className="flex flex-col items-center gap-4">
        {!user ? (
          <button 
            onClick={handleGoogleSignIn}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Sign in with Google
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <img 
                src={user.photoURL} 
                alt={user.displayName}
                className="w-12 h-12 rounded-full"
              />
              <div className="text-center">
                {/* Split displayName into first and last name */}
                <h2 className="text-xl font-semibold">
                  {user.displayName.split(' ')[0]} {/* First Name */}
                </h2>
                <h3 className="text-lg">
                  {user.displayName.split(' ').slice(1).join(' ')} {/* Last Name */}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
                   <button 
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
        
        
      </div>
    </div>
  );
}
