import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { SidebarProvider, useSidebar } from './context/SidebarContext'
import Navbar from './components/Navbar'
import ModernDashboard from './pages/ModernDashboard'
import Recommendations from './pages/Recommendations'
import Help from './pages/Help'
import Sensors from './pages/Sensors'
import ImageAnalysis from './pages/ImageAnalysis'
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

const AppContent = () => {
  const { sidebarOpen } = useSidebar();
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className={`transition-all duration-300 pt-16 lg:pt-0 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      }`}>
        <Routes>
          <Route path="/" element={<ModernDashboard />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/image-analysis" element={<ImageAnalysis />} />
          <Route path="/help" element={<Help />} />
          <Route path="/sensors" element={<Sensors />} />
        </Routes>
      </main>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <SidebarProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SidebarProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
