'use client';

import { firestoreService } from '../firebase/services/firestore';
import { authService } from '../firebase/services/auth';
import { useState, useEffect } from 'react';

export default function Home() {
  const [testResult, setTestResult] = useState('');
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (redirecting) {
      window.location.href = '/preferences';
    }
  }, [countdown, redirecting]);

  const handleGoogleSignIn = async () => {
    try {
      const userResult = await authService.signInWithGoogle();
      setUser(userResult);
      setTestResult(`✅ Signed in as ${userResult.displayName}`);
      setCountdown(5);
      setRedirecting(true);
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
      <h1 className="text-4xl font-bold">Welcome to Project Name!</h1>
      
      <div className="flex flex-col items-center gap-4">
        {!user ? (
          <div className="flex flex-col items-center gap-4">
            <div className="form-control w-full max-w-xs">
              <input 
                type="text" 
                placeholder="Username" 
                className="input input-bordered w-full" 
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="input input-bordered w-full mt-2" 
              />
              <button 
                className="btn btn-primary w-full mt-4"
              >
                Login
              </button>
            </div>
            
            <div className="divider">OR</div>
            
            <button 
              onClick={handleGoogleSignIn}
              className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="text-center">
                {/* Split displayName into first and last name */}
                <h2 className="text-3xl font-semibold">
                  {user.displayName.split(' ')[0]} {/* First Name */}
                </h2>
                <h3 className="text-2xl">
                  {user.displayName.split(' ').slice(1).join(' ')} {/* Last Name */}
                </h3>
                <p className="text-lg text-gray-600">{user.email}</p>
              </div>
            </div>
                   <button 
              onClick={handleSignOut}
              className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xl"
            >
              Sign Out
            </button>
            {redirecting && (
              <div className="text-center mt-4">
                <p className="text-2xl mb-2">Plese confirm information. Redirecting to preferences in:</p>
                <div className="countdown font-mono text-7xl">
                  <span style={{ "--value": countdown }} className="countdown"></span>
                </div>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}
