'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getCookie, setCookie, deleteCookie, clearAuthCookies } from '@/lib/cookies';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check cookies immediately for authentication state
    const checkCookieAuth = () => {
      const userRole = getCookie('userRole');
      const tokenTimestamp = getCookie('tokenTimestamp');
      const adminSession = getCookie('adminSession');

      if (userRole || adminSession) {
        // Check if token is expired (24 hours)
        if (tokenTimestamp) {
          const currentTime = Date.now();
          const tokenAge = currentTime - parseInt(tokenTimestamp);
          const twentyFourHours = 24 * 60 * 60 * 1000;

          if (tokenAge > twentyFourHours) {
            handleLogout();
            return;
          }
        }

        setUserRole(userRole);
        if (adminSession) {
          try {
            const parsedSession = JSON.parse(adminSession);
            setUser(parsedSession);
          } catch (error) {
            console.error('Error parsing admin session:', error);
          }
        }
        setLoading(false);
        return;
      }
    };

    checkCookieAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user); // Debug log
      setUser(user);

      // Get user role from cookies
      if (user) {
        const storedRole = getCookie('userRole');
        setUserRole(storedRole);

        // Set authToken cookie for middleware
        try {
          const token = await user.getIdToken();
          setCookie('authToken', token, 24);
        } catch (error) {
          setCookie('authToken', user.uid, 24);
        }
      } else {
        // If no Firebase user, check if we have cookie auth
        checkCookieAuth();
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearAuthCookies();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const setUserRoleWithTimestamp = (role, userData = null) => {
    setUserRole(role);
    if (userData) {
      setUser(userData);
      // Set dummy/real token for middleware
      setCookie('authToken', userData.uid || 'mock-token', 24);
    }
    setCookie('userRole', role, 24);
    setCookie('tokenTimestamp', Date.now().toString(), 24);
  };

  const value = {
    user,
    loading,
    userRole,
    handleLogout,
    setUserRole: setUserRoleWithTimestamp
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
