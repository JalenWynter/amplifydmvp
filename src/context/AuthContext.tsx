'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getCurrentUserInfo } from '@/lib/firebase/users';
import { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isReviewer: boolean;
  isUploader: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          
          const userInfo = await getCurrentUserInfo();
          console.log('User info in AuthContext:', userInfo);
          setCurrentUser(userInfo);
          setError(null);
        } catch (err: unknown) {
          console.error("Error fetching user info from Firestore:", err);
          let errorMessage = "Failed to load user profile.";
          if (err instanceof Error) {
              errorMessage = err.message;
          } else if (typeof err === "object" && err !== null && "message" in err) {
              errorMessage = (err as { message: string }).message;
          }
          setError(errorMessage);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        setError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = currentUser?.role === 'admin';
  const isReviewer = currentUser?.role === 'reviewer';
  const isUploader = currentUser?.role === 'uploader';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, firebaseUser, isAdmin, isReviewer, isUploader }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
