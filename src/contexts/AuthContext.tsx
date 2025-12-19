import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types/ride';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsWhatsApp: boolean;
  login: () => Promise<void>;
  logout: () => void;
  setWhatsApp: (whatsApp: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo purposes
const mockUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex.johnson@vit.ac.in',
  photoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=AJ',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setUser(mockUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const setWhatsApp = useCallback((whatsApp: string) => {
    setUser((prev) => prev ? { ...prev, whatsApp } : null);
  }, []);

  const needsWhatsApp = !!user && !user.whatsApp;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        needsWhatsApp,
        login,
        logout,
        setWhatsApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
