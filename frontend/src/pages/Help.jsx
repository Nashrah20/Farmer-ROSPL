import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Help = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 pt-16 lg:pt-0">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-2 flex items-center justify-center gap-3">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {t.help.title}
          </h1>
          <p className="text-lg text-amber-700">{t.help.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* Getting Started */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-6">
            <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-3">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              {t.help.gettingStarted}
            </h2>
            <div className="space-y-3 text-amber-800">
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
