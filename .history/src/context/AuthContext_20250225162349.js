"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/firebase/services/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🚀 [AuthProvider] Mounted");

    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log("👤 [AuthProvider] User changed:", user); // Logs user object or null
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log("🔄 [AuthProvider] Unmounted");
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log("🧭 [useAuth] Context Value:", context); // Log context whenever hook is used

  if (context === undefined) {
    console.error(
      "❌ [useAuth] Error: useAuth must be used within an AuthProvider"
    );
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
