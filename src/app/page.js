'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '../firebase/services/auth';
import { firestoreService } from '../firebase/services/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [testResult, setTestResult] = useState('');
  const [userData, setUserData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

  // Dummy login handler for username/password form (does nothing for now)
  const handleSubmit = (e) => {
    e.preventDefault();
    // You can add real login logic here
    setTestResult('Login button clicked');
  };

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
    if (user && !redirecting) {
      setCountdown(5);
      setRedirecting(true);
    }
  }, [user, redirecting]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (redirecting) {
      router.push('/address');
    }
  }, [countdown, redirecting, router]);

  useEffect(() => {
    document.title = "Login - Survive";
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const userResult = await authService.signInWithGoogle();
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
      setTestResult('✅ Signed out successfully');
    } catch (error) {
      setTestResult(`❌ Sign out failed: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Left side - Login/Welcome Card */}
      <div className="w-1/2 flex items-center justify-center px-4">
        { !user ? (
          // Login Card for not logged in state
          <Card className="w-full max-w-md p-8 bg-card shadow-lg rounded-lg">
            <CardHeader>
              <h1 className="text-2xl font-bold text-center mb-4">Sign in to Survive</h1>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="username" className="block text-sm font-medium text-muted-foreground">Username</Label>
                  <Input id="username" type="text" placeholder="Enter your username" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-muted-foreground">Password</Label>
                  <Input id="password" type="password" placeholder="********" className="mt-1" />
                </div>
                <Button type="submit" variant="default" className="w-full mt-4">Login</Button>
              </form>
              <Separator className="my-4" />
              <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">Sign in with Google</Button>
            </CardContent>
          </Card>
        ) : (
          // Welcome Card for logged in user
          <Card className="w-full max-w-md p-8 bg-card shadow-lg rounded-lg">
            <CardHeader>
              <h1 className="text-2xl font-bold text-center mb-2">Welcome, {user.displayName.split(' ')[0]}</h1>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground mb-4">{user.email}</p>
              <Button onClick={handleSignOut} variant="destructive" className="w-full">Sign Out</Button>
              {redirecting && (
                <div className="mt-4 text-center">
                  <p className="text-sm">Redirecting in <span>{countdown}</span> seconds...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* DaisyUI vertical splitter */}
      <div className="divider divider-vertical divider-accent"></div>

      {/* Right side - Image */}
      <div className="w-1/2 hidden md:flex items-center justify-center">
        <Image
          src="/amogus.png"
          alt="Among Us"
          width={600}
          height={600}
          className="object-contain"
        />
      </div>
    </div>
  );
}
