import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { SidebarProvider, useSidebar } from './context/SidebarContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ModernDashboard from './pages/ModernDashboard'
import Recommendations from './pages/Recommendations'
import Help from './pages/Help'
import Sensors from './pages/Sensors'
import ImageAnalysis from './pages/ImageAnalysis'
import Login from './pages/Login'
import Register from './pages/Register'
import { initOfflineSystem } from './offline/init'
import './index.css'

// OFFLINE-FIRST: Initialize offline-first architecture
initOfflineSystem();

// Register Service Worker (only in production build)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('✅ PWA Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New PWA version available! Refresh to update.');
              // Auto-reload after 3 seconds
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            }
          });
        });
      })
      .catch(error => {
        console.error('❌ PWA Service Worker registration failed:', error);
      });
  });
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { sidebarOpen } = useSidebar();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen">
      {user && <Navbar />}
      <main className={`transition-all duration-300 ${
        user ? (sidebarOpen ? 'lg:ml-64 pt-16 lg:pt-0' : 'lg:ml-20 pt-16 lg:pt-0') : ''
      }`}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          
          <Route path="/" element={<ProtectedRoute><ModernDashboard /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/image-analysis" element={<ProtectedRoute><ImageAnalysis /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
          <Route path="/sensors" element={<ProtectedRoute><Sensors /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <SidebarProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </SidebarProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
