import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Help = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            ❓ {t.help.title}
          </h1>
          <p className="text-lg text-gray-600">{t.help.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* Getting Started */}
          <div className="backdrop-blur-lg bg-white/60 rounded-2xl shadow-xl p-6 border-2 border-white/60">
            <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center">
              <span className="text-3xl mr-3">🚀</span>
              {t.help.gettingStarted}
            </h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>1. {t.help.step1Title}:</strong> {t.help.step1Desc}</p>
              <p><strong>2. {t.help.step2Title}:</strong> {t.help.step2Desc}</p>
              <p><strong>3. {t.help.step3Title}:</strong> {t.help.step3Desc}</p>
              <p><strong>4. {t.help.step4Title}:</strong> {t.help.step4Desc}</p>
            </div>
          </div>

          {/* Features */}
          <div className="backdrop-blur-lg bg-white/60 rounded-2xl shadow-xl p-6 border-2 border-white/60">
            <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center">
              <span className="text-3xl mr-3">✨</span>
              {t.help.keyFeatures}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2">📊 {t.help.feature1Title}</h3>
                <p className="text-sm text-gray-700">{t.help.feature1Desc}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-bold text-purple-800 mb-2">🤖 {t.help.feature2Title}</h3>
                <p className="text-sm text-gray-700">{t.help.feature2Desc}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2">📈 {t.help.feature3Title}</h3>
                <p className="text-sm text-gray-700">{t.help.feature3Desc}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-bold text-orange-800 mb-2">📡 {t.help.feature4Title}</h3>
                <p className="text-sm text-gray-700">{t.help.feature4Desc}</p>
              </div>
            </div>
          </div>

          {/* Understanding Metrics */}
          <div className="backdrop-blur-lg bg-white/60 rounded-2xl shadow-xl p-6 border-2 border-white/60">
            <h2 className="text-2xl font-bold text-purple-700 mb-4 flex items-center">
              <span className="text-3xl mr-3">📚</span>
              {t.help.understandingMetrics}
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-gray-800">💧 {t.help.soilMoisture}:</h3>
                <p className="text-sm text-gray-700">{t.help.soilMoistureDesc}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">🔵 {t.help.nitrogen}:</h3>
                <p className="text-sm text-gray-700">{t.help.nitrogenDesc}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">🟡 {t.help.phosphorus}:</h3>
                <p className="text-sm text-gray-700">{t.help.phosphorusDesc}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">🟣 {t.help.potassium}:</h3>
                <p className="text-sm text-gray-700">{t.help.potassiumDesc}</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="backdrop-blur-lg bg-white/60 rounded-2xl shadow-xl p-6 border-2 border-white/60">
            <h2 className="text-2xl font-bold text-orange-700 mb-4 flex items-center">
              <span className="text-3xl mr-3">💡</span>
              {t.help.faq}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{t.help.q1}</h3>
                <p className="text-sm text-gray-700 ml-4">{t.help.a1}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{t.help.q2}</h3>
                <p className="text-sm text-gray-700 ml-4">{t.help.a2}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">{t.help.q3}</h3>
                <p className="text-sm text-gray-700 ml-4">{t.help.a3}</p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="backdrop-blur-lg bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-3xl font-black mb-2">{t.help.needMoreHelp}</h2>
            <p className="mb-4">{t.help.teamSupport}</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="font-bold">📧 {t.help.email}</p>
                <p className="text-sm">support@farmai.com</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="font-bold">📞 {t.help.phone}</p>
                <p className="text-sm">+91 1800-FARM-AI</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="font-bold">💬 {t.help.chat}</p>
                <p className="text-sm">{t.help.available247}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
