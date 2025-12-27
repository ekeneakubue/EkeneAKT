"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call - in production, this would call your backend
    // For demo purposes, we'll accept any email/password combination
    // In a real app, you'd validate against your database
    
    // Simple validation
    if (!email || !password) {
      return false;
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // For demo: accept any valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Create user object
    const newUser: User = {
      id: Date.now().toString(),
      email: email.toLowerCase().trim(),
      name: email.split("@")[0], // Use email prefix as name
    };

    setUser(newUser);
    return true;
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    // Simulate API call - in production, this would call your backend
    if (!email || !password || !name) {
      return false;
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Validate password length
    if (password.length < 6) {
      return false;
    }

    // Create user object
    const newUser: User = {
      id: Date.now().toString(),
      email: email.toLowerCase().trim(),
      name: name.trim(),
    };

    setUser(newUser);
    return true;
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


