import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import ModernDashboard from './pages/ModernDashboard'
import Analytics from './pages/Analytics'
import Recommendations from './pages/Recommendations'
import Help from './pages/Help'
import Sensors from './pages/Sensors'
import ImageAnalysis from './pages/ImageAnalysis'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<ModernDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/image-analysis" element={<ImageAnalysis />} />
            <Route path="/help" element={<Help />} />
            <Route path="/sensors" element={<Sensors />} />
          </Routes>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>,
)
