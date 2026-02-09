/**
 * Authentication Context
 * Manages global auth state and provides auth methods to components
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authApi from '../api/auth';
import * as tokenStorage from '../utils/tokenStorage';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const savedToken = tokenStorage.getToken();
      
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      // Verify token and get user info
      const result = await authApi.getCurrentUser(savedToken);
      
      if (result.success && result.user) {
        setToken(savedToken);
        setUser(result.user);
      } else {
        // Token invalid, remove it
        tokenStorage.removeToken();
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login({ email, password });

      if (result.success && result.token && result.user) {
        tokenStorage.saveToken(result.token);
        setToken(result.token);
        setUser(result.user);
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Login failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const result = await authApi.register({ email, password, name });

      if (result.success && result.token && result.user) {
        tokenStorage.saveToken(result.token);
        setToken(result.token);
        setUser(result.user);
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Registration failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const logout = () => {
    tokenStorage.removeToken();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

