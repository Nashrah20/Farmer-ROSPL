import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { farmAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language } = useLanguage();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    soil_type: 'black_soil'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const soilTypes = [
    { value: 'black_soil', label: { en: 'Black Soil', hi: 'काली मिट्टी', mr: 'काळी माती' } },
    { value: 'red_soil', label: { en: 'Red Soil', hi: 'लाल मिट्टी', mr: 'लाल माती' } },
    { value: 'laterite_soil', label: { en: 'Laterite Soil', hi: 'लैटेराइट मिट्टी', mr: 'लॅटेराइट माती' } },
    { value: 'alluvial_soil', label: { en: 'Alluvial Soil', hi: 'जलोढ़ मिट्टी', mr: 'गाळाची माती' } },
    { value: 'saline_alkaline_soil', label: { en: 'Saline/Alkaline Soil', hi: 'लवणीय/क्षारीय मिट्टी', mr: 'क्षारीय माती' } }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await farmAPI.register(registerData);
      
      if (response.data.success) {
        // Auto-login after registration
        login(response.data.user);
        navigate('/dashboard');
      } else {
        setError(response.data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="text-6xl">🌾</div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {language === 'hi' ? 'नया खाता बनाएं' : language === 'mr' ? 'नवीन खाते तयार करा' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {language === 'hi' ? 'या' : language === 'mr' ? 'किंवा' : 'Or'}{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
              {language === 'hi' ? 'लॉगिन करें' : language === 'mr' ? 'लॉगिन करा' : 'sign in to existing account'}
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'उपयोगकर्ता नाम' : language === 'mr' ? 'वापरकर्तानाव' : 'Username'}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder={language === 'hi' ? 'उपयोगकर्ता नाम दर्ज करें' : language === 'mr' ? 'वापरकर्तानाव प्रविष्ट करा' : 'Enter username'}
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'पासवर्ड' : language === 'mr' ? 'पासवर्ड' : 'Password'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder={language === 'hi' ? 'कम से कम 6 अक्षर' : language === 'mr' ? 'किमान 6 अक्षरे' : 'At least 6 characters'}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : language === 'mr' ? 'पासवर्डची पुष्टी करा' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder={language === 'hi' ? 'पासवर्ड दोबारा दर्ज करें' : language === 'mr' ? 'पासवर्ड पुन्हा प्रविष्ट करा' : 'Re-enter password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="soil_type" className="block text-sm font-medium text-gray-700 mb-1">
                🌱 {language === 'hi' ? 'मिट्टी का प्रकार' : language === 'mr' ? 'मातीचा प्रकार' : 'Soil Type'}
              </label>
              <select
                id="soil_type"
                name="soil_type"
                required
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={formData.soil_type}
                onChange={handleChange}
              >
                {soilTypes.map((soil) => (
                  <option key={soil.value} value={soil.value}>
                    {soil.label[language] || soil.label.en}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {language === 'hi' 
                  ? 'यह आपके सभी अनुशंसाओं में डिफ़ॉल्ट रूप से चुना जाएगा' 
                  : language === 'mr' 
                  ? 'हे तुमच्या सर्व शिफारशींमध्ये डीफॉल्टनुसार निवडले जाईल' 
                  : 'This will be auto-selected in all your recommendations'}
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>{language === 'hi' ? 'खाता बनाया जा रहा है...' : language === 'mr' ? 'खाते तयार होत आहे...' : 'Creating account...'}</span>
              ) : (
                <span>{language === 'hi' ? 'खाता बनाएं' : language === 'mr' ? 'खाते तयार करा' : 'Create account'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
