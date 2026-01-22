import React, { createContext, useContext, useState, useEffect } from 'react';

// Translations for all pages
const translations = {
  en: {
    // Common
    appName: 'FarmAI',
    tagline: 'Smart Farming, Smarter Future',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    yes: 'Yes',
    no: 'No',
    
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      recommendations: 'AI Recommendations',
      imageAnalysis: 'Image Analysis',
      help: 'Help',
      sensors: 'Your Sensors',
      farmerDashboard: 'Farmer Dashboard',
      welcomeBack: 'Welcome back!'
    },
    
    // Dashboard
    dashboard: {
      title: 'FarmAI Dashboard',
      selectZone: 'Select Your Farm Zone',
      chooseZone: 'Choose a zone...',
      liveConditions: '⚡ Live Farm Conditions',
      soilMoisture: 'Soil Moisture',
      temperature: 'Temperature',
      humidity: 'Humidity',
      soilNutrients: 'Soil Nutrients',
      nitrogen: 'Nitrogen',
      phosphorus: 'Phosphorus',
      potassium: 'Potassium',
      getAIRecommendations: 'Get AI Recommendations',
      processingMagic: 'Processing Magic...',
      welcome: 'Welcome to FarmAI',
      welcomeMessage: 'Select a farm zone above to unlock the power of AI-driven agriculture insights!',
      hot: 'Hot',
      perfect: 'Perfect',
      cool: 'Cool',
      waterNeeded: 'Water Needed',
      irrigationRecommendation: 'Irrigation Recommendation',
      liters: 'Liters',
      fertilizerMix: 'Fertilizer Mix',
      npkRecommendation: 'NPK Recommendation',
      aiRecommendation: 'AI Recommendation',
      poweredByML: 'Powered by Machine Learning',
      aiExplanation: 'AI Explanation',
      currentConditions: 'Current Conditions (Model Input)',
      moisture: 'Moisture',
      temp: 'Temp',
      rainfall: 'Rainfall',
      welcomeToFarmAI: 'Welcome to FarmAI',
      selectZonePrompt: 'Select a farm zone above to unlock the power of AI-driven agriculture insights! 🚀'
    },
    
    // Recommendations Page
    recommendations: {
      title: 'AI Recommendations',
      subtitle: 'Get intelligent farming suggestions powered by Machine Learning',
      selectZone: 'Select Farm Zone',
      selectAZone: 'Select a zone...',
      refreshZones: 'Refresh Zones',
      refreshing: 'Refreshing...',
      getRecommendation: 'Get Recommendation',
      processing: 'Processing...',
      zonesLoaded: 'zones loaded from database',
      irrigation: 'Irrigation',
      nitrogenN: 'Nitrogen (N)',
      phosphorusP: 'Phosphorus (P)',
      potassiumK: 'Potassium (K)',
      explanation: '💡 Explanation',
      currentConditions: 'Current Conditions',
      moisture: 'Moisture',
      temp: 'Temp',
      rainfall: 'Rainfall',
      approveAction: '✅ Approve & Save Action',
      approving: 'Approving...',
      readyToHelp: 'Ready to Help!',
      selectZonePrompt: 'Select a zone and click "Get Recommendation" to receive AI-powered farming advice'
    },
    
    // Analytics Page
    analytics: {
      title: 'Analytics & Trends',
      subtitle: 'Analyze your farm data over time',
      selectZone: 'Select Farm Zone',
      selectAZone: 'Select a zone...',
      loadData: '📈 Load Analytics',
      loadingAnalytics: 'Loading analytics...',
      last7Days: 'Last 7 Days Trends',
      soilMoisture: 'Soil Moisture (%)',
      temperature: 'Temperature (°C)',
      humidity: 'Humidity (%)',
      noData: 'No Data Available',
      selectZonePrompt: 'Select a zone to view analytics',
      totalDataPoints: 'Total Data Points',
      daysTracked: 'Days Tracked',
      zoneType: 'Zone Type',
      cropType: 'Crop Type',
      zone: 'Zone'
    },
    
    // Image Analysis Page
    imageAnalysis: {
      title: 'Crop Health Image Analysis',
      subtitle: 'Upload an image of your crop to detect diseases using AI',
      uploadImage: 'Upload Crop Image',
      selectPhoto: 'Select a photo of your crop or leaf',
      selectImage: 'Select Image',
      dragDrop: 'Drag & drop an image here, or click to select',
      supportedFormats: 'Supported formats: JPG, PNG, WEBP',
      analyzing: 'Analyzing...',
      analyze: 'Analyze',
      analysisResults: 'Analysis Results',
      uploadToSeeResults: 'Upload and analyze an image to see results',
      healthStatus: 'Health Status',
      score: 'Score',
      diseaseDetection: 'Disease Detection',
      detected: 'Detected',
      severity: 'Severity',
      confidence: 'Confidence',
      symptoms: 'Symptoms',
      likelyCauses: 'Likely Causes',
      issuesDetected: 'Issues Detected',
      colorAnalysis: 'Color Analysis',
      recommendations: 'Recommendations',
      treatment: 'Treatment',
      prevention: 'Prevention',
      immediateActionRequired: 'Immediate Action Required!',
      urgentAttention: 'This crop requires urgent attention. Please address the issues identified above as soon as possible.',
      noDisease: 'No disease detected',
      healthyPlant: 'Your plant appears to be healthy!',
      tipsTitle: 'Tips for Best Results',
      goodLighting: 'Good Lighting',
      lightingTip: 'Take photos in natural daylight for accurate color analysis',
      closeUpView: 'Close-Up View',
      closeUpTip: 'Capture leaves or affected areas in detail',
      clearFocus: 'Clear Focus',
      focusTip: 'Ensure image is not blurry for better detection',
      aiAnalysisInProgress: 'AI Analysis in Progress',
      usingGemini: 'Using Gemini AI Vision... This may take 3-5 seconds'
    },
    
    // Sensors Page
    sensors: {
      title: 'Your Sensors',
      subtitle: 'Monitor all your farm sensors - updates every hour',
      currentHourData: 'Current Hour Data',
      lastRefreshed: 'Last refreshed',
      loadingSensors: 'Loading sensors...',
      updated: 'Updated',
      moisture: 'Moisture',
      temperature: 'Temperature',
      humidity: 'Humidity',
      phLevel: 'pH Level',
      active: 'Active',
      totalSensors: 'Total Sensors',
      activeZones: 'Active Zones',
      soilTypes: 'Soil Types',
      cropTypes: 'Crop Types',
      refreshData: '🔄 Refresh Data',
      lastUpdated: 'Last Updated',
      allZones: 'All Zones',
      noSensors: 'No sensor data available',
      inactive: '✗ Inactive',
      ph: 'pH Level'
    },
    
    // Help Page
    help: {
      title: 'Help & Support',
      subtitle: 'Everything you need to know about FarmAI',
      gettingStarted: 'Getting Started',
      step1Title: 'Select Your Farm Zone',
      step1Desc: 'Choose from the dropdown to view your farm\'s real-time data',
      step2Title: 'View Current Conditions',
      step2Desc: 'Monitor soil moisture, temperature, humidity, and nutrient levels',
      step3Title: 'Get AI Recommendations',
      step3Desc: 'Click the button to receive smart farming suggestions',
      step4Title: 'Analyze Trends',
      step4Desc: 'Visit Analytics page to see historical data and charts',
      keyFeatures: 'Key Features',
      feature1Title: 'Real-time Monitoring',
      feature1Desc: 'Track soil moisture, temperature, humidity, and nutrients in real-time',
      feature2Title: 'AI Recommendations',
      feature2Desc: 'Get intelligent irrigation and fertilizer suggestions',
      feature3Title: 'Analytics Dashboard',
      feature3Desc: 'View trends with 1 day, 1 week, or 1 month charts',
      feature4Title: 'Multi-Sensor Support',
      feature4Desc: 'Monitor multiple farm zones simultaneously',
      understandingMetrics: 'Understanding Metrics',
      soilMoisture: 'Soil Moisture (%)',
      soilMoistureDesc: 'Optimal range: 40-70%. Higher values may indicate over-irrigation.',
      nitrogen: 'Nitrogen (N)',
      nitrogenDesc: 'Essential for plant growth. Typical range: 100-300 mg/kg',
      phosphorus: 'Phosphorus (P)',
      phosphorusDesc: 'Promotes root development. Typical range: 10-30 mg/kg',
      potassium: 'Potassium (K)',
      potassiumDesc: 'Improves disease resistance. Typical range: 100-250 mg/kg',
      faq: 'Frequently Asked Questions',
      q1: 'Q: How often is data updated?',
      a1: 'A: Sensor data is updated in real-time. Check the "Last Updated" timestamp.',
      q2: 'Q: What do the AI recommendations mean?',
      a2: 'A: AI analyzes your soil and weather conditions to suggest optimal irrigation (liters) and fertilizer amounts (grams).',
      q3: 'Q: Can I view historical data?',
      a3: 'A: Yes! Visit the Analytics page to see trends over 1 day, 1 week, or 1 month.',
      needMoreHelp: 'Need More Help?',
      teamSupport: 'Our team is here to support you!',
      email: 'Email',
      phone: 'Phone',
      chat: 'Chat',
      available247: 'Available 24/7',
      contact: 'Contact Support',
      documentation: 'Documentation',
      emailUs: 'Email us at support@farmai.com'
    },
    
    // Zones
    zones: {
      CS1: '🌾 Coarse - Groundnut',
      CS2: '🌾 Coarse - Bajra',
      CS3: '🍉 Coarse - Watermelon',
      BS1: '🌿 Black - Cotton',
      BS2: '🌱 Black - Soybean',
      BS3: '🌾 Black - Jowar',
      LS1: '🌰 Laterite - Cashew',
      LS2: '🥥 Laterite - Coconut',
      LS3: '🌾 Laterite - Rice',
      AS1: '🍬 Alluvial - Sugarcane',
      AS2: '🌾 Alluvial - Wheat',
      AS3: '🍌 Alluvial - Banana',
      YS1: '🌾 Yellow-Brown - Rice',
      YS2: '🌾 Yellow-Brown - Ragi',
      YS3: '🌾 Yellow-Brown - Tur'
    }
  },
  
  hi: {
    // Common
    appName: 'FarmAI',
    tagline: 'स्मार्ट खेती, बेहतर भविष्य',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफल',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    back: 'वापस',
    next: 'अगला',
    yes: 'हां',
    no: 'नहीं',
    
    // Navigation
    nav: {
      dashboard: 'डैशबोर्ड',
      analytics: 'विश्लेषण',
      recommendations: 'AI सुझाव',
      imageAnalysis: 'फोटो जांच',
      help: 'मदद',
      sensors: 'आपके सेंसर',
      farmerDashboard: 'किसान डैशबोर्ड',
      welcomeBack: 'वापसी पर स्वागत!'
    },
    
    // Dashboard
    dashboard: {
      title: 'FarmAI डैशबोर्ड',
      selectZone: 'अपना खेत चुनें',
      chooseZone: 'ज़ोन चुनें...',
      liveConditions: '⚡ खेत की वर्तमान स्थिति',
      soilMoisture: 'मिट्टी की नमी',
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      soilNutrients: 'मिट्टी पोषक तत्व',
      nitrogen: 'नाइट्रोजन',
      phosphorus: 'फॉस्फोरस',
      potassium: 'पोटेशियम',
      getAIRecommendations: 'AI सुझाव लें',
      processingMagic: 'प्रोसेस हो रहा है...',
      welcome: 'FarmAI में आपका स्वागत है',
      welcomeMessage: 'AI-संचालित कृषि सुझाव पाने के लिए ऊपर अपना खेत ज़ोन चुनें!',
      hot: 'गर्म',
      perfect: 'सही',
      cool: 'ठंडा',
      waterNeeded: 'पानी चाहिए',
      irrigationRecommendation: 'सिंचाई सिफारिश',
      liters: 'लीटर',
      fertilizerMix: 'खाद मिश्रण',
      npkRecommendation: 'NPK सिफारिश',
      aiRecommendation: 'AI सिफारिश',
      poweredByML: 'मशीन लर्निंग द्वारा संचालित',
      aiExplanation: 'AI व्याख्या',
      currentConditions: 'वर्तमान स्थिति (मॉडल इनपुट)',
      moisture: 'नमी',
      temp: 'तापमान',
      rainfall: 'बारिश',
      welcomeToFarmAI: 'FarmAI में आपका स्वागत है',
      selectZonePrompt: 'AI-संचालित कृषि सुझाव पाने के लिए ऊपर अपना खेत ज़ोन चुनें! 🚀'
    },
    
    // Recommendations Page
    recommendations: {
      title: 'AI सुझाव',
      subtitle: 'मशीन लर्निंग द्वारा बुद्धिमान खेती सुझाव प्राप्त करें',
      selectZone: 'खेत ज़ोन चुनें',
      selectAZone: 'ज़ोन चुनें...',
      refreshZones: 'ज़ोन रीफ्रेश करें',
      refreshing: 'रीफ्रेश हो रहा है...',
      getRecommendation: 'सुझाव प्राप्त करें',
      processing: 'प्रोसेस हो रहा है...',
      zonesLoaded: 'ज़ोन डेटाबेस से लोड हुए',
      irrigation: 'सिंचाई',
      nitrogenN: 'नाइट्रोजन (N)',
      phosphorusP: 'फॉस्फोरस (P)',
      potassiumK: 'पोटेशियम (K)',
      explanation: '💡 व्याख्या',
      currentConditions: 'वर्तमान स्थिति',
      moisture: 'नमी',
      temp: 'तापमान',
      rainfall: 'बारिश',
      approveAction: '✅ मंजूर करें और सहेजें',
      approving: 'मंजूर हो रहा है...',
      readyToHelp: 'मदद के लिए तैयार!',
      selectZonePrompt: 'AI-संचालित खेती सलाह पाने के लिए ज़ोन चुनें और "सुझाव प्राप्त करें" पर क्लिक करें'
    },
    
    // Analytics Page
    analytics: {
      title: 'विश्लेषण और रुझान',
      subtitle: 'समय के साथ अपने खेत के डेटा का विश्लेषण करें',
      selectZone: 'खेत ज़ोन चुनें',
      selectAZone: 'ज़ोन चुनें...',
      loadData: '📈 विश्लेषण लोड करें',
      loadingAnalytics: 'विश्लेषण लोड हो रहा है...',
      last7Days: 'पिछले 7 दिनों का रुझान',
      soilMoisture: 'मिट्टी की नमी (%)',
      temperature: 'तापमान (°C)',
      humidity: 'आर्द्रता (%)',
      noData: 'कोई डेटा उपलब्ध नहीं',
      selectZonePrompt: 'विश्लेषण देखने के लिए ज़ोन चुनें',
      totalDataPoints: 'कुल डेटा पॉइंट्स',
      daysTracked: 'ट्रैक किए गए दिन',
      zoneType: 'ज़ोन प्रकार',
      cropType: 'फसल प्रकार',
      zone: 'ज़ोन'
    },
    
    // Image Analysis Page
    imageAnalysis: {
      title: 'फसल स्वास्थ्य छवि विश्लेषण',
      subtitle: 'AI का उपयोग करके रोग का पता लगाने के लिए अपनी फसल की फोटो अपलोड करें',
      uploadImage: 'फसल की फोटो अपलोड करें',
      selectPhoto: 'अपनी फसल या पत्ती की फोटो चुनें',
      selectImage: 'फोटो चुनें',
      dragDrop: 'यहां फोटो खींचें और छोड़ें, या चुनने के लिए क्लिक करें',
      supportedFormats: 'समर्थित फॉर्मेट: JPG, PNG, WEBP',
      analyzing: 'विश्लेषण हो रहा है...',
      analyze: 'विश्लेषण करें',
      analysisResults: 'विश्लेषण परिणाम',
      uploadToSeeResults: 'परिणाम देखने के लिए फोटो अपलोड करें और विश्लेषण करें',
      healthStatus: 'स्वास्थ्य स्थिति',
      score: 'स्कोर',
      diseaseDetection: 'रोग पहचान',
      detected: 'पहचाना गया',
      severity: 'गंभीरता',
      confidence: 'विश्वास',
      symptoms: 'लक्षण',
      likelyCauses: 'संभावित कारण',
      issuesDetected: 'समस्याएं पाई गईं',
      colorAnalysis: 'रंग विश्लेषण',
      recommendations: 'सुझाव',
      treatment: 'उपचार',
      prevention: 'रोकथाम',
      immediateActionRequired: 'तुरंत कार्रवाई आवश्यक!',
      urgentAttention: 'इस फसल को तुरंत ध्यान देने की जरूरत है। कृपया ऊपर पहचानी गई समस्याओं को जल्द से जल्द संबोधित करें।',
      noDisease: 'कोई रोग नहीं मिला',
      healthyPlant: 'आपका पौधा स्वस्थ दिखता है!',
      tipsTitle: 'सर्वोत्तम परिणामों के लिए टिप्स',
      goodLighting: 'अच्छी रोशनी',
      lightingTip: 'सटीक रंग विश्लेषण के लिए प्राकृतिक रोशनी में फोटो लें',
      closeUpView: 'क्लोज-अप दृश्य',
      closeUpTip: 'पत्तियों या प्रभावित क्षेत्रों को विस्तार से कैप्चर करें',
      clearFocus: 'साफ फोकस',
      focusTip: 'बेहतर पहचान के लिए सुनिश्चित करें कि छवि धुंधली नहीं है',
      aiAnalysisInProgress: 'AI विश्लेषण जारी है',
      usingGemini: 'Gemini AI Vision का उपयोग... इसमें 3-5 सेकंड लग सकते हैं'
    },
    
    // Sensors Page
    sensors: {
      title: 'आपके सेंसर',
      subtitle: 'अपने सभी खेत सेंसर की निगरानी करें - हर घंटे अपडेट',
      currentHourData: 'वर्तमान घंटे का डेटा',
      lastRefreshed: 'अंतिम रीफ्रेश',
      loadingSensors: 'सेंसर लोड हो रहे हैं...',
      updated: 'अपडेट किया गया',
      moisture: 'नमी',
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      phLevel: 'pH स्तर',
      active: 'सक्रिय',
      totalSensors: 'कुल सेंसर',
      activeZones: 'सक्रिय ज़ोन',
      soilTypes: 'मिट्टी के प्रकार',
      cropTypes: 'फसल के प्रकार',
      refreshData: '🔄 डेटा रीफ्रेश करें',
      lastUpdated: 'आखिरी अपडेट',
      allZones: 'सभी ज़ोन',
      noSensors: 'कोई सेंसर डेटा उपलब्ध नहीं',
      inactive: '✗ निष्क्रिय',
      ph: 'pH स्तर'
    },
    
    // Help Page
    help: {
      title: 'मदद और सहायता',
      subtitle: 'FarmAI के बारे में आपको जो कुछ भी जानना है',
      gettingStarted: 'शुरू करना',
      step1Title: 'अपना खेत ज़ोन चुनें',
      step1Desc: 'अपने खेत का रीयल-टाइम डेटा देखने के लिए ड्रॉपडाउन से चुनें',
      step2Title: 'वर्तमान स्थिति देखें',
      step2Desc: 'मिट्टी की नमी, तापमान, आर्द्रता और पोषक तत्व स्तर की निगरानी करें',
      step3Title: 'AI सुझाव प्राप्त करें',
      step3Desc: 'स्मार्ट खेती सुझाव प्राप्त करने के लिए बटन पर क्लिक करें',
      step4Title: 'रुझान विश्लेषण करें',
      step4Desc: 'ऐतिहासिक डेटा और चार्ट देखने के लिए विश्लेषण पेज पर जाएं',
      keyFeatures: 'मुख्य विशेषताएं',
      feature1Title: 'रीयल-टाइम निगरानी',
      feature1Desc: 'मिट्टी की नमी, तापमान, आर्द्रता और पोषक तत्वों को रीयल-टाइम में ट्रैक करें',
      feature2Title: 'AI सुझाव',
      feature2Desc: 'बुद्धिमान सिंचाई और खाद सुझाव प्राप्त करें',
      feature3Title: 'विश्लेषण डैशबोर्ड',
      feature3Desc: '1 दिन, 1 सप्ताह या 1 महीने के चार्ट के साथ रुझान देखें',
      feature4Title: 'मल्टी-सेंसर समर्थन',
      feature4Desc: 'एक साथ कई खेत ज़ोन की निगरानी करें',
      understandingMetrics: 'मेट्रिक्स को समझना',
      soilMoisture: 'मिट्टी की नमी (%)',
      soilMoistureDesc: 'इष्टतम सीमा: 40-70%। अधिक मान अधिक सिंचाई का संकेत हो सकता है।',
      nitrogen: 'नाइट्रोजन (N)',
      nitrogenDesc: 'पौधों की वृद्धि के लिए आवश्यक। विशिष्ट सीमा: 100-300 mg/kg',
      phosphorus: 'फॉस्फोरस (P)',
      phosphorusDesc: 'जड़ विकास को बढ़ावा देता है। विशिष्ट सीमा: 10-30 mg/kg',
      potassium: 'पोटेशियम (K)',
      potassiumDesc: 'रोग प्रतिरोधक क्षमता में सुधार करता है। विशिष्ट सीमा: 100-250 mg/kg',
      faq: 'अक्सर पूछे जाने वाले प्रश्न',
      q1: 'प्रश्न: डेटा कितनी बार अपडेट होता है?',
      a1: 'उत्तर: सेंसर डेटा रीयल-टाइम में अपडेट होता है। "आखिरी अपडेट" टाइमस्टैम्प देखें।',
      q2: 'प्रश्न: AI सुझाव का क्या मतलब है?',
      a2: 'उत्तर: AI आपकी मिट्टी और मौसम की स्थिति का विश्लेषण करके इष्टतम सिंचाई (लीटर) और खाद मात्रा (ग्राम) सुझाता है।',
      q3: 'प्रश्न: क्या मैं ऐतिहासिक डेटा देख सकता हूं?',
      a3: 'उत्तर: हां! 1 दिन, 1 सप्ताह या 1 महीने के रुझान देखने के लिए विश्लेषण पेज पर जाएं।',
      needMoreHelp: 'और मदद चाहिए?',
      teamSupport: 'हमारी टीम आपकी मदद के लिए यहां है!',
      email: 'ईमेल',
      phone: 'फोन',
      chat: 'चैट',
      available247: '24/7 उपलब्ध',
      contact: 'सहायता से संपर्क करें',
      documentation: 'दस्तावेज़ीकरण',
      emailUs: 'हमें support@farmai.com पर ईमेल करें'
    },
    
    // Zones
    zones: {
      CS1: '🌾 बलुई - मूंगफली',
      CS2: '🌾 बलुई - बाजरा',
      CS3: '🍉 बलुई - तरबूज',
      BS1: '🌿 काली - कपास',
      BS2: '🌱 काली - सोयाबीन',
      BS3: '🌾 काली - ज्वार',
      LS1: '🌰 लेटराइट - काजू',
      LS2: '🥥 लेटराइट - नारियल',
      LS3: '🌾 लेटराइट - चावल',
      AS1: '🍬 जलोढ़ - गन्ना',
      AS2: '🌾 जलोढ़ - गेहूं',
      AS3: '🍌 जलोढ़ - केला',
      YS1: '🌾 पीली-भूरी - चावल',
      YS2: '🌾 पीली-भूरी - रागी',
      YS3: '🌾 पीली-भूरी - तूर'
    }
  },
  
  mr: {
    // Common
    appName: 'FarmAI',
    tagline: 'स्मार्ट शेती, उज्ज्वल भविष्य',
    loading: 'लोड होत आहे...',
    error: 'त्रुटी',
    success: 'यशस्वी',
    submit: 'सबमिट करा',
    cancel: 'रद्द करा',
    save: 'जतन करा',
    delete: 'हटवा',
    edit: 'संपादित करा',
    back: 'मागे',
    next: 'पुढे',
    yes: 'होय',
    no: 'नाही',
    
    // Navigation
    nav: {
      dashboard: 'डॅशबोर्ड',
      analytics: 'विश्लेषण',
      recommendations: 'AI शिफारसी',
      imageAnalysis: 'फोटो तपासणी',
      help: 'मदत',
      sensors: 'तुमचे सेन्सर',
      farmerDashboard: 'शेतकरी डॅशबोर्ड',
      welcomeBack: 'पुन्हा स्वागत!'
    },
    
    // Dashboard
    dashboard: {
      title: 'FarmAI डॅशबोर्ड',
      selectZone: 'तुमचे शेत निवडा',
      chooseZone: 'झोन निवडा...',
      liveConditions: '⚡ शेताची सध्याची स्थिती',
      soilMoisture: 'मातीची ओलावा',
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      soilNutrients: 'माती पोषक द्रव्ये',
      nitrogen: 'नायट्रोजन',
      phosphorus: 'फॉस्फरस',
      potassium: 'पोटॅशियम',
      getAIRecommendations: 'AI शिफारसी घ्या',
      processingMagic: 'प्रक्रिया होत आहे...',
      welcome: 'FarmAI मध्ये आपले स्वागत',
      welcomeMessage: 'AI-चालित शेती सल्ला मिळवण्यासाठी वर तुमचा शेत झोन निवडा!',
      hot: 'गरम',
      perfect: 'उत्तम',
      cool: 'थंड',
      waterNeeded: 'पाणी लागेल',
      irrigationRecommendation: 'सिंचन शिफारस',
      liters: 'लिटर',
      fertilizerMix: 'खत मिश्रण',
      npkRecommendation: 'NPK शिफारस',
      aiRecommendation: 'AI शिफारस',
      poweredByML: 'मशीन लर्निंग द्वारे संचालित',
      aiExplanation: 'AI स्पष्टीकरण',
      currentConditions: 'सध्याची स्थिती (मॉडेल इनपुट)',
      moisture: 'ओलावा',
      temp: 'तापमान',
      rainfall: 'पाऊस',
      welcomeToFarmAI: 'FarmAI मध्ये आपले स्वागत',
      selectZonePrompt: 'AI-चालित शेती सल्ला मिळवण्यासाठी वर तुमचा शेत झोन निवडा! 🚀'
    },
    
    // Recommendations Page
    recommendations: {
      title: 'AI शिफारसी',
      subtitle: 'मशीन लर्निंगद्वारे बुद्धिमान शेती सल्ला मिळवा',
      selectZone: 'शेत झोन निवडा',
      selectAZone: 'झोन निवडा...',
      refreshZones: 'झोन रिफ्रेश करा',
      refreshing: 'रिफ्रेश होत आहे...',
      getRecommendation: 'शिफारस मिळवा',
      processing: 'प्रक्रिया होत आहे...',
      zonesLoaded: 'झोन डेटाबेसमधून लोड झाले',
      irrigation: 'सिंचन',
      nitrogenN: 'नायट्रोजन (N)',
      phosphorusP: 'फॉस्फरस (P)',
      potassiumK: 'पोटॅशियम (K)',
      explanation: '💡 स्पष्टीकरण',
      currentConditions: 'सध्याची स्थिती',
      moisture: 'ओलावा',
      temp: 'तापमान',
      rainfall: 'पाऊस',
      approveAction: '✅ मंजूर करा आणि जतन करा',
      approving: 'मंजूर होत आहे...',
      readyToHelp: 'मदतीसाठी तयार!',
      selectZonePrompt: 'AI-चालित शेती सल्ला मिळवण्यासाठी झोन निवडा आणि "शिफारस मिळवा" वर क्लिक करा'
    },
    
    // Analytics Page
    analytics: {
      title: 'विश्लेषण आणि ट्रेंड',
      subtitle: 'कालांतराने तुमच्या शेताच्या डेटाचे विश्लेषण करा',
      selectZone: 'शेत झोन निवडा',
      selectAZone: 'झोन निवडा...',
      loadData: '📈 विश्लेषण लोड करा',
      loadingAnalytics: 'विश्लेषण लोड होत आहे...',
      last7Days: 'मागील 7 दिवसांचा ट्रेंड',
      soilMoisture: 'मातीची ओलावा (%)',
      temperature: 'तापमान (°C)',
      humidity: 'आर्द्रता (%)',
      noData: 'डेटा उपलब्ध नाही',
      selectZonePrompt: 'विश्लेषण पाहण्यासाठी झोन निवडा',
      totalDataPoints: 'एकूण डेटा पॉइंट्स',
      daysTracked: 'ट्रॅक केलेले दिवस',
      zoneType: 'झोन प्रकार',
      cropType: 'पीक प्रकार',
      zone: 'झोन'
    },
    
    // Image Analysis Page
    imageAnalysis: {
      title: 'पीक आरोग्य प्रतिमा विश्लेषण',
      subtitle: 'AI वापरून रोग शोधण्यासाठी तुमच्या पिकाचा फोटो अपलोड करा',
      uploadImage: 'पीक फोटो अपलोड करा',
      selectPhoto: 'तुमच्या पिकाचा किंवा पानाचा फोटो निवडा',
      selectImage: 'फोटो निवडा',
      dragDrop: 'येथे फोटो ड्रॅग आणि ड्रॉप करा, किंवा निवडण्यासाठी क्लिक करा',
      supportedFormats: 'समर्थित फॉरमॅट: JPG, PNG, WEBP',
      analyzing: 'विश्लेषण होत आहे...',
      analyze: 'विश्लेषण करा',
      analysisResults: 'विश्लेषण निकाल',
      uploadToSeeResults: 'निकाल पाहण्यासाठी फोटो अपलोड करा आणि विश्लेषण करा',
      healthStatus: 'आरोग्य स्थिती',
      score: 'स्कोअर',
      diseaseDetection: 'रोग शोध',
      detected: 'आढळले',
      severity: 'तीव्रता',
      confidence: 'विश्वास',
      symptoms: 'लक्षणे',
      likelyCauses: 'संभाव्य कारणे',
      issuesDetected: 'समस्या आढळल्या',
      colorAnalysis: 'रंग विश्लेषण',
      recommendations: 'शिफारसी',
      treatment: 'उपचार',
      prevention: 'प्रतिबंध',
      immediateActionRequired: 'तातडीने कृती आवश्यक!',
      urgentAttention: 'या पिकाला तातडीने लक्ष देणे आवश्यक आहे. कृपया वर ओळखलेल्या समस्यांचे लवकरात लवकर निराकरण करा.',
      noDisease: 'रोग आढळला नाही',
      healthyPlant: 'तुमचे पीक निरोगी दिसते!',
      tipsTitle: 'सर्वोत्तम परिणामांसाठी टिप्स',
      goodLighting: 'चांगला प्रकाश',
      lightingTip: 'अचूक रंग विश्लेषणासाठी नैसर्गिक प्रकाशात फोटो घ्या',
      closeUpView: 'क्लोज-अप दृश्य',
      closeUpTip: 'पाने किंवा प्रभावित भाग तपशीलवार कॅप्चर करा',
      clearFocus: 'स्पष्ट फोकस',
      focusTip: 'चांगल्या शोधासाठी प्रतिमा अस्पष्ट नसल्याची खात्री करा',
      aiAnalysisInProgress: 'AI विश्लेषण सुरू आहे',
      usingGemini: 'Gemini AI Vision वापरत आहे... यास 3-5 सेकंद लागू शकतात'
    },
    
    // Sensors Page
    sensors: {
      title: 'तुमचे सेन्सर',
      subtitle: 'तुमच्या सर्व शेत सेन्सरचे निरीक्षण करा - दर तासाला अपडेट',
      currentHourData: 'सध्याच्या तासाचा डेटा',
      lastRefreshed: 'शेवटचे रिफ्रेश',
      loadingSensors: 'सेन्सर लोड होत आहेत...',
      updated: 'अपडेट केले',
      moisture: 'ओलावा',
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      phLevel: 'pH पातळी',
      active: 'सक्रिय',
      totalSensors: 'एकूण सेन्सर',
      activeZones: 'सक्रिय झोन',
      soilTypes: 'माती प्रकार',
      cropTypes: 'पीक प्रकार',
      refreshData: '🔄 डेटा रिफ्रेश करा',
      lastUpdated: 'शेवटचे अपडेट',
      allZones: 'सर्व झोन',
      noSensors: 'सेन्सर डेटा उपलब्ध नाही',
      inactive: '✗ निष्क्रिय',
      ph: 'pH पातळी'
    },
    
    // Help Page
    help: {
      title: 'मदत आणि सहाय्य',
      subtitle: 'FarmAI बद्दल तुम्हाला माहित असणे आवश्यक असलेले सर्व काही',
      gettingStarted: 'सुरुवात करणे',
      step1Title: 'तुमचा शेत झोन निवडा',
      step1Desc: 'तुमच्या शेताचा रिअल-टाइम डेटा पाहण्यासाठी ड्रॉपडाउनमधून निवडा',
      step2Title: 'सध्याची स्थिती पहा',
      step2Desc: 'मातीची ओलावा, तापमान, आर्द्रता आणि पोषक पातळीचे निरीक्षण करा',
      step3Title: 'AI शिफारसी मिळवा',
      step3Desc: 'स्मार्ट शेती सूचना मिळवण्यासाठी बटणावर क्लिक करा',
      step4Title: 'ट्रेंड विश्लेषण करा',
      step4Desc: 'ऐतिहासिक डेटा आणि चार्ट पाहण्यासाठी विश्लेषण पृष्ठावर जा',
      keyFeatures: 'मुख्य वैशिष्ट्ये',
      feature1Title: 'रिअल-टाइम निरीक्षण',
      feature1Desc: 'मातीची ओलावा, तापमान, आर्द्रता आणि पोषक घटक रिअल-टाइममध्ये ट्रॅक करा',
      feature2Title: 'AI शिफारसी',
      feature2Desc: 'बुद्धिमान सिंचन आणि खत सूचना मिळवा',
      feature3Title: 'विश्लेषण डॅशबोर्ड',
      feature3Desc: '1 दिवस, 1 आठवडा किंवा 1 महिन्याच्या चार्टसह ट्रेंड पहा',
      feature4Title: 'मल्टी-सेन्सर समर्थन',
      feature4Desc: 'एकाच वेळी अनेक शेत झोनचे निरीक्षण करा',
      understandingMetrics: 'मेट्रिक्स समजून घेणे',
      soilMoisture: 'मातीची ओलावा (%)',
      soilMoistureDesc: 'इष्टतम श्रेणी: 40-70%. जास्त मूल्ये जास्त सिंचन दर्शवू शकतात.',
      nitrogen: 'नायट्रोजन (N)',
      nitrogenDesc: 'वनस्पतींच्या वाढीसाठी आवश्यक. विशिष्ट श्रेणी: 100-300 mg/kg',
      phosphorus: 'फॉस्फरस (P)',
      phosphorusDesc: 'मुळांच्या विकासाला प्रोत्साहन देते. विशिष्ट श्रेणी: 10-30 mg/kg',
      potassium: 'पोटॅशियम (K)',
      potassiumDesc: 'रोग प्रतिकारशक्ती सुधारते. विशिष्ट श्रेणी: 100-250 mg/kg',
      faq: 'वारंवार विचारले जाणारे प्रश्न',
      q1: 'प्रश्न: डेटा किती वेळा अपडेट होतो?',
      a1: 'उत्तर: सेन्सर डेटा रिअल-टाइममध्ये अपडेट होतो. "शेवटचे अपडेट" टाइमस्टॅम्प तपासा.',
      q2: 'प्रश्न: AI शिफारशींचा अर्थ काय?',
      a2: 'उत्तर: AI तुमची माती आणि हवामान परिस्थितीचे विश्लेषण करून इष्टतम सिंचन (लिटर) आणि खत प्रमाण (ग्रॅम) सुचवते.',
      q3: 'प्रश्न: मी ऐतिहासिक डेटा पाहू शकतो का?',
      a3: 'उत्तर: होय! 1 दिवस, 1 आठवडा किंवा 1 महिन्याचे ट्रेंड पाहण्यासाठी विश्लेषण पृष्ठावर जा.',
      needMoreHelp: 'अजून मदत हवी?',
      teamSupport: 'आमची टीम तुम्हाला मदत करण्यासाठी येथे आहे!',
      email: 'ईमेल',
      phone: 'फोन',
      chat: 'चॅट',
      available247: '24/7 उपलब्ध',
      contact: 'सहाय्यशी संपर्क साधा',
      documentation: 'दस्तऐवज',
      emailUs: 'आम्हाला support@farmai.com वर ईमेल करा'
    },
    
    // Zones
    zones: {
      CS1: '🌾 वाळूमिश्रित - भुईमूग',
      CS2: '🌾 वाळूमिश्रित - बाजरी',
      CS3: '🍉 वाळूमिश्रित - कलिंगड',
      BS1: '🌿 काळी - कापूस',
      BS2: '🌱 काळी - सोयाबीन',
      BS3: '🌾 काळी - ज्वारी',
      LS1: '🌰 लॅटराइट - काजू',
      LS2: '🥥 लॅटराइट - नारळ',
      LS3: '🌾 लॅटराइट - तांदूळ',
      AS1: '🍬 गाळाची - ऊस',
      AS2: '🌾 गाळाची - गहू',
      AS3: '🍌 गाळाची - केळी',
      YS1: '🌾 पिवळी-तपकिरी - तांदूळ',
      YS2: '🌾 पिवळी-तपकिरी - नाचणी',
      YS3: '🌾 पिवळी-तपकिरी - तूर'
    }
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to 'en'
    return localStorage.getItem('farmAI_language') || 'en';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('farmAI_language', language);
  }, [language]);

  const t = translations[language];
  
  // Helper function to get zone label
  const getZoneLabel = (zoneId) => {
    return t.zones[zoneId] || zoneId;
  };

  // Cycle through languages
  const cycleLanguage = () => {
    const langs = ['en', 'hi', 'mr'];
    const currentIndex = langs.indexOf(language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  // Get next language name for button display
  const getNextLanguageName = () => {
    if (language === 'en') return 'हिंदी';
    if (language === 'hi') return 'मराठी';
    return 'English';
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      getZoneLabel,
      cycleLanguage,
      getNextLanguageName
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
