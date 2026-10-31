import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Load user from localStorage synchronously so protected routes don't
  // redirect to /login on the first render after a page refresh
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('farmAI_user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('farmAI_user');
      return null;
    }
  });
  const loading = false;

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('farmAI_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('farmAI_user');
  };

  const updateSoilType = (soilType) => {
    if (user) {
      const updatedUser = { ...user, soil_type: soilType };
      setUser(updatedUser);
      localStorage.setItem('farmAI_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    logout,
    updateSoilType,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
