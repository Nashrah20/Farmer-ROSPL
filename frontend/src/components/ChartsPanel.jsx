import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const ChartsPanel = ({ historyData }) => {
  const { language } = useLanguage();
  const [timePeriod, setTimePeriod] = useState('week');

  const filteredAndFormattedData = useMemo(() => {
    if (!historyData || !historyData.sensor_readings || historyData.sensor_readings.length === 0) {
      return [];
    }

    const now = new Date();
    const cutoffDate = new Date();
    
    switch(timePeriod) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 7);
    }

    return historyData.sensor_readings
      .map((item, index) => {
        const weather = historyData.weather[index] || {};
        return {
          timestamp: new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          moisture: item.soil_moisture?.toFixed(1) || 0,
          N: item.nitrogen?.toFixed(0) || 0,
          P: item.phosphorus?.toFixed(0) || 0,
          K: item.potassium?.toFixed(0) || 0,
          temp: item.temperature?.toFixed(1) || 0,
          humidity: item.humidity?.toFixed(0) || 0,
          itemDate: new Date(item.timestamp)
        };
      })
      .filter(item => item.itemDate >= cutoffDate)
      .slice(-50);
  }, [historyData, timePeriod]);

  if (!historyData || !historyData.sensor_readings || historyData.sensor_readings.length === 0) {
    return (
      <div className="backdrop-blur-md bg-gradient-to-br from-purple-100/50 to-pink-100/50 rounded-3xl shadow-xl p-12 text-center border border-white/50">
        <div className="text-8xl mb-4 animate-pulse">📊</div>
        <p className="text-xl font-bold text-gray-700">
          {language === 'hi' ? 'कोई एतिहासिक डेटा उपलब्ध नहीं' : 
           language === 'mr' ? 'कोणताही ऐतिहासिक डेटा उपलब्ध नाही' : 
           'No historical data available'}
        </p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-white/40 to-blue-50/40 rounded-3xl shadow-2xl p-8 border-2 border-white/60">
      {/* Time Period Selector */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
        <h3 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
          <span className="text-4xl mr-3 animate-pulse">📈</span>
          {language === 'hi' ? 'एतिहासिक रुझान' : 
           language === 'mr' ? 'ऐतिहासिक ट्रेंड' : 
           'Historical Trends'}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setTimePeriod('day')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-110 shadow-lg ${
              timePeriod === 'day'
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white scale-105'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            📅 {language === 'hi' ? '1 दिन' : language === 'mr' ? '1 दिवस' : '1 Day'}
          </button>
          <button
            onClick={() => setTimePeriod('week')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-110 shadow-lg ${
              timePeriod === 'week'
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white scale-105'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            📊 {language === 'hi' ? '1 हफ्ता' : language === 'mr' ? '1 आठवडा' : '1 Week'}
          </button>
          <button
            onClick={() => setTimePeriod('month')}
            className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-110 shadow-lg ${
              timePeriod === 'month'
                ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white scale-105'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            📆 1 Month
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 shadow-lg">
          <h4 className="text-xl font-bold text-blue-700 mb-4">
            💧 {language === 'hi' ? 'मिट्टी की नमी' : 
                language === 'mr' ? 'मातीची नमी' : 
                'Soil Moisture'}
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={filteredAndFormattedData}>
              <defs>
                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="moisture" stroke="#3B82F6" strokeWidth={3} fill="url(#colorMoisture)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 shadow-lg">
          <h4 className="text-xl font-bold text-purple-700 mb-4">
            🧪 {language === 'hi' ? 'NPK पोषक तत्व' : 
                 language === 'mr' ? 'NPK पोषक घटक' : 
                 'NPK Nutrients'}
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredAndFormattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="N" stroke="#8B5CF6" strokeWidth={3} />
              <Line type="monotone" dataKey="P" stroke="#F59E0B" strokeWidth={3} />
              <Line type="monotone" dataKey="K" stroke="#EC4899" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsPanel;
