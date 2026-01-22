import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ImageAnalysis = () => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Suppress browser extension errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const msg = args[0]?.toString() || '';
      if (msg.includes('message channel closed') || 
          msg.includes('Extension context invalidated')) {
        return; // Ignore extension errors
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select a valid image file (JPG, PNG, WebP)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
      };
      reader.readAsDataURL(file);
      
      // Reset previous results
      setResult(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Convert image to base64 using Promise
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image'));
        reader.readAsDataURL(selectedImage);
      });

      // Call API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('http://localhost:5000/api/image/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          zone_id: localStorage.getItem('selectedZone') || 'zone_001'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (data.success && data.analysis) {
        setResult(data.analysis);
      } else {
        setError(data.error || data.analysis?.error || 'Analysis failed');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again with a smaller image.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please ensure the backend is running on http://localhost:5000');
      } else {
        setError('Failed to analyze image: ' + err.message);
      }
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-green-600 bg-green-100';
      case 'FAIR':
        return 'text-yellow-600 bg-yellow-100';
      case 'STRESSED':
        return 'text-orange-600 bg-orange-100';
      case 'DISEASED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'moderate':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          🌱 {t.imageAnalysis.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t.imageAnalysis.uploadImage}</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {!imagePreview ? (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    {t.imageAnalysis.selectPhoto}
                  </p>
                </div>
              ) : (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-full h-auto rounded-lg mx-auto"
                  style={{ maxHeight: '300px' }}
                />
              )}
            </div>

            <div className="mt-4 flex gap-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={analyzing}
                />
                <div className={`cursor-pointer px-4 py-2 rounded-lg transition text-center ${
                  analyzing ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}>
                  📷 {t.imageAnalysis.selectImage}
                </div>
              </label>

              <button
                onClick={analyzeImage}
                disabled={!selectedImage || analyzing}
                className={`flex-1 px-4 py-2 rounded-lg transition ${
                  !selectedImage || analyzing
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {analyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.imageAnalysis.analyzing}
                  </span>
                ) : `🔍 ${t.imageAnalysis.analyze}`}
              </button>
            </div>

            {analyzing && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div>
                    <p className="text-blue-700 font-semibold">🧠 {t.imageAnalysis.aiAnalysisInProgress}</p>
                    <p className="text-blue-600 text-sm">{t.imageAnalysis.usingGemini}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                ❌ {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t.imageAnalysis.analysisResults}</h2>
            
            {!result ? (
              <div className="text-center text-gray-500 py-12">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>{t.imageAnalysis.uploadToSeeResults}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Health Status */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">{t.imageAnalysis.healthStatus}:</span>
                    <span className={`px-3 py-1 rounded-full font-semibold ${getHealthColor(result.health_status)}`}>
                      {result.health_status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (result.health_score || 0) >= 85 ? 'bg-green-500' :
                        (result.health_score || 0) >= 70 ? 'bg-yellow-500' :
                        (result.health_score || 0) >= 50 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${result.health_score || 0}%` }}
                    />
                  </div>
                  <div className="text-center mt-1 text-sm text-gray-600">
                    {t.imageAnalysis.score}: {result.health_score ? result.health_score.toFixed(1) : 0}/100
                  </div>
                </div>

                {/* Disease Detection */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🔬 {t.imageAnalysis.diseaseDetection}</h3>
                  <p className="text-sm">
                    <span className="font-medium">{t.imageAnalysis.detected}:</span> {result.disease_detected || result.disease_name || 'Unknown'}
                  </p>
                  {result.severity && (
                    <p className="text-sm">
                      <span className="font-medium">{t.imageAnalysis.severity}:</span> 
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getSeverityColor(result.severity)}`}>
                        {result.severity}
                      </span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">{t.imageAnalysis.confidence}:</span> {
                      typeof result.confidence === 'object' 
                        ? `${result.confidence.level} (${result.confidence.score}%)` 
                        : `${result.confidence}%`
                    }
                  </p>
                </div>

                {/* Symptoms */}
                {result.symptoms && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🔍 {t.imageAnalysis.symptoms}</h3>
                    <p className="text-sm text-gray-700">{result.symptoms}</p>
                  </div>
                )}

                {/* Likely Causes */}
                {result.likely_causes && result.likely_causes.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">⚠️ {t.imageAnalysis.likelyCauses}</h3>
                    <ul className="space-y-1 text-sm">
                      {result.likely_causes.map((cause, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          <span className="text-gray-700">{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Anomalies (fallback for old format) */}
                {result.anomalies && result.anomalies.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">⚠️ {t.imageAnalysis.issuesDetected}</h3>
                    <div className="space-y-2">
                      {result.anomalies.map((anomaly, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(anomaly.severity)}`}>
                            {anomaly.severity}
                          </span>
                          <span className="text-gray-700">{anomaly.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Analysis */}
                {result.color_analysis && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🎨 {t.imageAnalysis.colorAnalysis}</h3>
                    {result.color_analysis.dominant_colors ? (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Dominant Colors:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {result.color_analysis.dominant_colors.map((color, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <span>{result.color_analysis.has_browning ? '✓' : '✗'}</span>
                            <span>Browning</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{result.color_analysis.has_yellowing ? '✓' : '✗'}</span>
                            <span>Yellowing</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{result.color_analysis.has_spots ? '✓' : '✗'}</span>
                            <span>Spots</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {result.color_analysis.green_dominance !== undefined && (
                          <div>
                            <span className="text-gray-600">Green Dominance:</span>
                            <span className="ml-2 font-medium">{result.color_analysis.green_dominance.toFixed(2)}</span>
                          </div>
                        )}
                        {result.color_analysis.brown_tissue_pct !== undefined && (
                          <div>
                            <span className="text-gray-600">Brown Tissue:</span>
                            <span className="ml-2 font-medium">{result.color_analysis.brown_tissue_pct.toFixed(1)}%</span>
                          </div>
                        )}
                        {result.color_analysis.dark_spots_pct !== undefined && (
                          <div>
                            <span className="text-gray-600">Dark Spots:</span>
                            <span className="ml-2 font-medium">{result.color_analysis.dark_spots_pct.toFixed(1)}%</span>
                          </div>
                        )}
                        {result.color_analysis.yellowing_pct !== undefined && (
                          <div>
                            <span className="text-gray-600">Yellowing:</span>
                            <span className="ml-2 font-medium">{result.color_analysis.yellowing_pct.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold mb-2">💡 {t.imageAnalysis.recommendations}</h3>
                    <ul className="space-y-2 text-sm">
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Treatment */}
                {result.treatment && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold mb-2">🩺 {t.imageAnalysis.treatment}</h3>
                    <p className="text-sm text-gray-700">{result.treatment}</p>
                  </div>
                )}

                {/* Prevention */}
                {result.prevention && (
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold mb-2">🛡️ {t.imageAnalysis.prevention}</h3>
                    <p className="text-sm text-gray-700">{result.prevention}</p>
                  </div>
                )}

                {/* Urgent Action */}
                {result.requires_immediate_action && (
                  <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center gap-2 text-red-700 font-semibold">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{t.imageAnalysis.immediateActionRequired}</span>
                    </div>
                    <p className="text-sm text-red-600 mt-2">
                      {t.imageAnalysis.urgentAttention}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📸 {t.imageAnalysis.tipsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="border rounded p-3">
              <div className="font-semibold text-green-600 mb-1">✓ {t.imageAnalysis.goodLighting}</div>
              <p className="text-gray-600">{t.imageAnalysis.lightingTip}</p>
            </div>
            <div className="border rounded p-3">
              <div className="font-semibold text-green-600 mb-1">✓ {t.imageAnalysis.closeUpView}</div>
              <p className="text-gray-600">{t.imageAnalysis.closeUpTip}</p>
            </div>
            <div className="border rounded p-3">
              <div className="font-semibold text-green-600 mb-1">✓ {t.imageAnalysis.clearFocus}</div>
              <p className="text-gray-600">{t.imageAnalysis.focusTip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysis;
