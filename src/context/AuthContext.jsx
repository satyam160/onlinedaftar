import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authApi,
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [tokenState, setTokenState] = useState(getToken());
  const [user, setUser] = useState(getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function initAuth() {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          setStoredUser(profile);
        } catch (err) {
          // Token expired or server unreachable
          if (err.status === 401) {
            logout();
          }
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async ({ identifier, password }) => {
    try {
      const data = await authApi.login({ identifier, password });
      setToken(data.token);
      setStoredUser(data.user);
      setTokenState(data.token);
      setUser(data.user);
      setIsDemoMode(false);
      return { success: true, user: data.user };
    } catch (err) {
      // If server unreachable, throw clean error
      throw err;
    }
  };

  const register = async ({ username, email, password, role }) => {
    try {
      const data = await authApi.register({ username, email, password, role });
      setToken(data.token);
      setStoredUser(data.user);
      setTokenState(data.token);
      setUser(data.user);
      setIsDemoMode(false);
      return { success: true, user: data.user };
    } catch (err) {
      throw err;
    }
  };

  // Instant 1-click Demo Login for interviewers & fast reviews
  const demoLogin = (role = 'worker') => {
    const demoUser = {
      id: 'demo-user-123',
      name: role === 'poster' ? 'Arjun Mehta' : 'Priya Sharma',
      email: role === 'poster' ? 'arjun@daftardemo.in' : 'priya.s@daftardemo.in',
      phone: '9876543210',
      role: role,
      kyc_verified: true,
      rating_avg: 4.92,
      rating_count: 28,
      bio: role === 'poster' 
        ? 'Founder at RetailLens. Escrow-first task poster with 100% on-time approval rate.'
        : 'Specialized field researcher & data auditor with 28 completed escrow gigs.',
      created_at: new Date(Date.now() - 86400000 * 90).toISOString()
    };
    setToken('demo-jwt-token');
    setStoredUser(demoUser);
    setTokenState('demo-jwt-token');
    setUser(demoUser);
    setIsDemoMode(true);
    return demoUser;
  };

  const logout = () => {
    removeToken();
    setStoredUser(null);
    setTokenState(null);
    setUser(null);
    setIsDemoMode(false);
  };

  const updateProfile = async ({ bio, name }) => {
    if (isDemoMode) {
      const updated = { ...user, bio: bio ?? user.bio, name: name ?? user.name };
      setUser(updated);
      setStoredUser(updated);
      return updated;
    }
    const res = await authApi.updateProfile({ bio, name });
    setUser(res.user);
    setStoredUser(res.user);
    return res.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: tokenState,
        isAuthenticated: !!user,
        isLoading,
        isDemoMode,
        login,
        register,
        demoLogin,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
