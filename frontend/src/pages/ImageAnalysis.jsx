import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ImageAnalysis = () => {
  const { t, language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Translation helper for disease names
  const translateDisease = (disease) => {
    if (!disease) return 'Unknown';
    
    const diseaseTranslations = {
      'Nutrient Deficiency (likely multiple)': language === 'hi' ? 'पोषक तत्वों की कमी (संभवतः एकाधिक)' : language === 'mr' ? 'पोषक तत्वांची कमी (बहुधा अनेक)' : disease,
      'Nutrient Deficiency': language === 'hi' ? 'पोषक तत्वों की कमी' : language === 'mr' ? 'पोषक तत्वांची कमी' : disease,
      'Nitrogen Deficiency': language === 'hi' ? 'नाइट्रोजन की कमी' : language === 'mr' ? 'नायट्रोजनची कमी' : disease,
      'Phosphorus Deficiency': language === 'hi' ? 'फास्फोरस की कमी' : language === 'mr' ? 'फॉस्फरसची कमी' : disease,
      'Potassium Deficiency': language === 'hi' ? 'पोटैशियम की कमी' : language === 'mr' ? 'पोटॅशियमची कमी' : disease,
      'Iron Deficiency': language === 'hi' ? 'आयरन की कमी' : language === 'mr' ? 'लोहाची कमी' : disease,
      'Magnesium Deficiency': language === 'hi' ? 'मैग्नीशियम की कमी' : language === 'mr' ? 'मॅग्नेशियमची कमी' : disease,
      'Unknown': language === 'hi' ? 'अज्ञात' : language === 'mr' ? 'अज्ञात' : disease
    };
    
    return diseaseTranslations[disease] || disease;
  };

  // Translation helper for severity levels
  const translateSeverity = (severity) => {
    if (!severity) return severity;
    
    const severityTranslations = {
      'high': language === 'hi' ? 'उच्च' : language === 'mr' ? 'उच्च' : 'high',
      'moderate': language === 'hi' ? 'मध्यम' : language === 'mr' ? 'मध्यम' : 'moderate',
      'medium': language === 'hi' ? 'मध्यम' : language === 'mr' ? 'मध्यम' : 'medium',
      'low': language === 'hi' ? 'कम' : language === 'mr' ? 'कमी' : 'low'
    };
    
    return severityTranslations[severity] || severity;
  };

  // Translation helper for confidence levels
  const translateConfidence = (confidence) => {
    if (!confidence) return confidence;
    
    if (typeof confidence === 'object') {
      const level = confidence.level;
      const levelTranslations = {
        'high': language === 'hi' ? 'उच्च' : language === 'mr' ? 'उच्च' : 'high',
        'moderate': language === 'hi' ? 'मध्यम' : language === 'mr' ? 'मध्यम' : 'moderate',
        'medium': language === 'hi' ? 'मध्यम' : language === 'mr' ? 'मध्यम' : 'medium',
        'low': language === 'hi' ? 'कम' : language === 'mr' ? 'कमी' : 'low'
      };
      return `${levelTranslations[level] || level} (${confidence.score}%)`;
    }
    return confidence;
  };

  // Translation helper for symptoms text
  const translateSymptoms = (text) => {
    if (!text || language === 'en') return text;
    
    // Direct phrase by phrase translation (more reliable)
    let translatedText = text;
    
    const translations = {
      'The leaf exhibits': language === 'hi' ? 'पत्ती प्रदर्शित करती है' : 'पान दाखवते',
      'prominent interveinal chlorosis': language === 'hi' ? 'प्रमुख अंतर्शिरीय क्लोरोसिस' : 'प्रमुख आंतर-शिरा क्लोरोसिस',
      'where the tissue between the veins appears yellow': language === 'hi' ? 'जहां नसों के बीच का ऊतक पीला दिखाई देता है' : 'जिथे शिरांमधील ऊती पिवळी दिसते',
      'while the veins themselves remain a darker green': language === 'hi' ? 'जबकि नसें स्वयं गहरे हरे रंग की रहती हैं' : 'तर शिरा स्वतः गडद हिरव्या राहतात',
      'There is also significant yellowing along the leaf margins': language === 'hi' ? 'पत्ती के किनारों के साथ महत्वपूर्ण पीलापन भी है' : 'पानाच्या कडांवर लक्षणीय पिवळेपणा देखील आहे',
      'progressing to light brown necrosis': language === 'hi' ? 'हल्के भूरे परिगलन में बढ़ते हुए' : 'हलक्या तपकिरी नेक्रोसिस मध्ये वाढते',
      'dead tissue': language === 'hi' ? 'मृत ऊतक' : 'मृत ऊती',
      'at the very tip and some parts of the edges': language === 'hi' ? 'बिल्कुल नोक पर और किनारों के कुछ हिस्सों में' : 'अगदी टोकावर आणि कडांच्या काही भागांमध्ये',
      'The overall texture in the affected areas appears somewhat mottled or uneven': language === 'hi' ? 'प्रभावित क्षेत्रों में समग्र बनावट कुछ चित्तीदार या असमान दिखाई देती है' : 'प्रभावित भागातील एकूण पोत काहीसे ठिपकेदार किंवा असमान दिसते',
    };
    
    // Replace each phrase
    Object.entries(translations).forEach(([eng, trans]) => {
      translatedText = translatedText.replace(eng, trans);
    });
    
    return translatedText;
  };

  // Translation helper for likely causes
  const translateCause = (text) => {
    if (!text || language === 'en') return text;
    
    const causeTranslations = {
      'Insufficient nitrogen in the soil': language === 'hi' ? 'मिट्टी में अपर्याप्त नाइट्रोजन' : 'मातीत अपुरा नायट्रोजन',
      'Poor soil fertility or nutrient depletion': language === 'hi' ? 'खराब मिट्टी की उर्वरता या पोषक तत्वों की कमी' : 'खराब माती सुपीकता किंवा पोषक तत्वांची कमी',
      'Inadequate fertilization or imbalanced nutrient management': language === 'hi' ? 'अपर्याप्त उर्वरक या असंतुलित पोषक प्रबंधन' : 'अपुरी खते किंवा असंतुलित पोषक व्यवस्थापन',
      'Waterlogging or poor drainage affecting nutrient uptake': language === 'hi' ? 'जलभराव या खराब जल निकासी जो पोषक तत्वों के अवशोषण को प्रभावित करता है' : 'जलसाचा किंवा खराब निचरा पोषक तत्व शोषणावर परिणाम करतो'
    };
    
    for (const [eng, trans] of Object.entries(causeTranslations)) {
      if (text.includes(eng)) {
        return text.replace(eng, trans);
      }
    }
    
    return text;
  };

  // Translation helper for recommendations and treatment
  const translateRecommendation = (text) => {
    if (!text || language === 'en') return text;
    
    const recTranslations = {
      // Suggestions translations
      'Conduct a comprehensive soil test to identify specific nutrient deficiencies and soil pH': language === 'hi' ? 'विशिष्ट पोषक तत्वों की कमी और मिट्टी का pH निर्धारित करने के लिए व्यापक मिट्टी परीक्षण करें' : 'विशिष्ट पोषक तत्वांची कमी आणि मातीचा pH ओळखण्यासाठी सर्वसमावेशक माती चाचणी करा',
      'Perform a comprehensive soil test to accurately identify specific nutrient deficiencies and soil pH': language === 'hi' ? 'विशिष्ट पोषक तत्वों की कमी और मिट्टी का pH सटीक रूप से निर्धारित करने के लिए व्यापक मिट्टी परीक्षण करें' : 'विशिष्ट पोषक तत्वांची कमी आणि मातीचा pH अचूकपणे ओळखण्यासाठी सर्वसमावेशक माती चाचणी करा',
      'Observe other leaves on the plant for similar symptoms to determine if it\'s a systemic issue': language === 'hi' ? 'यह एक प्रणालीगत समस्या है या नहीं यह निर्धारित करने के लिए पौधे की अन्य पत्तियों पर समान लक्षणों को देखें' : 'ही एक प्रणालीगत समस्या आहे की नाही हे निर्धारित करण्यासाठी वनस्पतीच्या इतर पानांवर समान लक्षणे पहा',
      'Adjust watering schedule to ensure consistent moisture without over-saturating the soil': language === 'hi' ? 'मिट्टी को अधिक संतृप्त किए बिना लगातार नमी सुनिश्चित करने के लिए सिंचाई अनुसूची समायोजित करें' : 'माती अति संपृक्त न करता सातत्यपूर्ण ओलावा सुनिश्चित करण्यासाठी सिंचन वेळापत्रक समायोजित करा',
      'If a soil test is not immediately feasible, consider a broad-spectrum fertilizer application with micronutrients as a temporary measure, while observing the plant\'s response': language === 'hi' ? 'यदि मिट्टी परीक्षण तुरंत संभव नहीं है, तो पौधे की प्रतिक्रिया देखते हुए एक अस्थायी उपाय के रूप में सूक्ष्म पोषक तत्वों के साथ व्यापक-स्पेक्ट्रम उर्वरक का उपयोग करें' : 'माती चाचणी लगेच शक्य नसल्यास, वनस्पतीचा प्रतिसाद पाहत असताना तात्पुरता उपाय म्हणून सूक्ष्म पोषक तत्वांसह विस्तृत-स्पेक्ट्रम खते वापरण्याचा विचार करा',
      
      'Identify the specific plant/crop to understand its particular nutrient requirements and ideal pH range': language === 'hi' ? 'विशिष्ट पौधे/फसल की पहचान करें ताकि इसकी विशेष पोषक आवश्यकताओं और आदर्श pH रेंज को समझा जा सके' : 'विशिष्ट वनस्पती/पीक ओळखा जेणेकरून तिच्या विशिष्ट पोषक गरजा आणि आदर्श pH श्रेणी समजू शकेल',
      'Based on soil test results, apply appropriate micronutrient fertilizers (e.g., iron chelate, magnesium sulfate) or adjust overall fertilizer program': language === 'hi' ? 'मिट्टी परीक्षण परिणामों के आधार पर, उपयुक्त सूक्ष्म पोषक उर्वरक (जैसे, आयरन केलेट, मैग्नीशियम सल्फेट) लागू करें या समग्र उर्वरक कार्यक्रम को समायोजित करें' : 'माती चाचणी निकालांवर आधारित, योग्य सूक्ष्म पोषक खते (उदा., लोह केलेट, मॅग्नेशियम सल्फेट) लावा किंवा एकूण खत कार्यक्रम समायोजित करा',
      'Monitor new growth for signs of improvement and observe other leaves on the plant for similar symptoms to assess the spread and severity of the issue': language === 'hi' ? 'सुधार के संकेतों के लिए नई वृद्धि की निगरानी करें और समस्या के प्रसार और गंभीरता का आकलन करने के लिए पौधे की अन्य पत्तियों पर समान लक्षणों को देखें' : 'सुधारणेच्या चिन्हांसाठी नवीन वाढीचे निरीक्षण करा आणि समस्येचा प्रसार आणि तीव्रता यांचे मूल्यांकन करण्यासाठी वनस्पतीच्या इतर पानांवर समान लक्षणे पहा',
      'Review current watering practices and ensure good soil drainage': language === 'hi' ? 'वर्तमान सिंचाई प्रथाओं की समीक्षा करें और अच्छी मिट्टी की निकासी सुनिश्चित करें' : 'सध्याच्या सिंचन पद्धतींचे पुनरावलोकन करा आणि चांगला माती निचरा सुनिश्चित करा',
      
      // Treatment translations
      'Treatment depends on the specific cause': language === 'hi' ? 'उपचार विशिष्ट कारण पर निर्भर करता है' : 'उपचार विशिष्ट कारणावर अवलंबून आहे',
      'A soil test is highly recommended to pinpoint the exact nutrient deficiency and soil pH': language === 'hi' ? 'सटीक पोषक तत्व की कमी और मिट्टी का pH निर्धारित करने के लिए मिट्टी परीक्षण अत्यधिक अनुशंसित है' : 'अचूक पोषक तत्व कमी आणि माती pH निश्चित करण्यासाठी माती चाचणी अत्यंत शिफारशीय आहे',
      'To address the suspected nutrient deficiency, a soil test is highly recommended to pinpoint the exact nutrient imbalance and soil pH': language === 'hi' ? 'संदिग्ध पोषक तत्व की कमी को संबोधित करने के लिए, सटीक पोषक असंतुलन और मिट्टी का pH निर्धारित करने के लिए मिट्टी परीक्षण अत्यधिक अनुशंसित है' : 'संशयित पोषक तत्व कमी दूर करण्यासाठी, अचूक पोषक असंतुलन आणि माती pH निश्चित करण्यासाठी माती चाचणी अत्यंत शिफारशीय आहे',
      'Based on results, apply appropriate fertilizers': language === 'hi' ? 'परिणामों के आधार पर, उपयुक्त उर्वरक लागू करें' : 'निकालांवर आधारित, योग्य खते लावा',
      'Based on the results': language === 'hi' ? 'परिणामों के आधार पर' : 'निकालांवर आधारित',
      'apply appropriate fertilizers': language === 'hi' ? 'उपयुक्त उर्वरक लागू करें' : 'योग्य खते लावा',
      'potassium sulfate for K': language === 'hi' ? 'पोटेशियम के लिए पोटेशियम सल्फेट' : 'K साठी पोटॅशियम सल्फेट',
      'magnesium sulfate for Mg': language === 'hi' ? 'मैग्नीशियम के लिए मैग्नीशियम सल्फेट' : 'Mg साठी मॅग्नेशियम सल्फेट',
      'or a balanced fertilizer if multiple deficiencies are present': language === 'hi' ? 'या एकाधिक कमियां होने पर संतुलित उर्वरक' : 'किंवा अनेक कमी असल्यास संतुलित खत',
      'Foliar sprays can provide a quicker but temporary fix for certain micronutrients': language === 'hi' ? 'पर्ण स्प्रे कुछ सूक्ष्म पोषक तत्वों के लिए तेज लेकिन अस्थायी समाधान प्रदान कर सकते हैं' : 'पर्णीय स्प्रे काही सूक्ष्म पोषक तत्वांसाठी जलद परंतु तात्पुरता उपाय प्रदान करू शकतात',
      'Ensure proper watering techniques, avoiding both waterlogging and drought stress': language === 'hi' ? 'जलभराव और सूखे के तनाव दोनों से बचते हुए उचित सिंचाई तकनीकों को सुनिश्चित करें' : 'जलसाचा आणि दुष्काळ ताण दोन्ही टाळत योग्य सिंचन तंत्र सुनिश्चित करा',
      'maintain optimal soil pH for the specific plant species': language === 'hi' ? 'विशिष्ट पौधे की प्रजातियों के लिए इष्टतम मिट्टी pH बनाए रखें' : 'विशिष्ट वनस्पती प्रजातींसाठी इष्टतम माती pH राखा',
      
      'For iron deficiency': language === 'hi' ? 'आयरन की कमी के लिए' : 'लोहाच्या कमीसाठी',
      'Apply chelated iron to the soil or as a foliar spray': language === 'hi' ? 'मिट्टी में या पर्ण स्प्रे के रूप में केलेटेड आयरन लागू करें' : 'मातीत किंवा पर्णीय स्प्रे म्हणून केलेटेड लोह लावा',
      'Adjust soil pH downwards if it\'s too high for the specific plant': language === 'hi' ? 'यदि यह विशिष्ट पौधे के लिए बहुत अधिक है तो मिट्टी का pH कम करें' : 'जर ते विशिष्ट वनस्पतीसाठी खूप जास्त असेल तर माती pH कमी करा',
      'For magnesium deficiency': language === 'hi' ? 'मैग्नीशियम की कमी के लिए' : 'मॅग्नेशियमच्या कमीसाठी',
      'Apply magnesium sulfate (Epsom salts) as a foliar spray or soil drench': language === 'hi' ? 'मैग्नीशियम सल्फेट (एप्सम सॉल्ट) को पर्ण स्प्रे या मिट्टी में डालें' : 'मॅग्नेशियम सल्फेट (एप्सम मीठ) पर्णीय स्प्रे किंवा माती ड्रेंच म्हणून लावा',
      'For potassium deficiency': language === 'hi' ? 'पोटेशियम की कमी के लिए' : 'पोटॅशियमच्या कमीसाठी',
      'Apply a balanced fertilizer with adequate potassium': language === 'hi' ? 'पर्याप्त पोटेशियम वाला संतुलित उर्वरक लागू करें' : 'पुरेशा पोटॅशियमसह संतुलित खत लावा',
      'or a potassium-specific supplement': language === 'hi' ? 'या पोटेशियम-विशिष्ट पूरक' : 'किंवा पोटॅशियम-विशिष्ट पूरक',
      'For pH imbalance': language === 'hi' ? 'pH असंतुलन के लिए' : 'pH असंतुलनासाठी',
      'Amend soil with elemental sulfur or peat moss to lower pH': language === 'hi' ? 'pH कम करने के लिए मिट्टी में तात्विक सल्फर या पीट मॉस मिलाएं' : 'pH कमी करण्यासाठी मूलभूत गंधक किंवा पीट मॉस मातीत मिसळा',
      'or lime to raise pH': language === 'hi' ? 'या pH बढ़ाने के लिए चूना' : 'किंवा pH वाढवण्यासाठी चुना',
      'as needed': language === 'hi' ? 'आवश्यकतानुसार' : 'आवश्यकतेनुसार',
      
      // Prevention translations
      'Conduct regular soil tests to monitor nutrient levels and pH': language === 'hi' ? 'पोषक तत्वों के स्तर और pH की निगरानी के लिए नियमित मिट्टी परीक्षण करें' : 'पोषक तत्व पातळी आणि pH यांचे निरीक्षण करण्यासाठी नियमित माती चाचण्या करा',
      'Maintain optimal soil pH for the specific plant species': language === 'hi' ? 'विशिष्ट पौधे की प्रजातियों के लिए इष्टतम मिट्टी pH बनाए रखें' : 'विशिष्ट वनस्पती प्रजातींसाठी इष्टतम माती pH राखा',
      'Provide balanced fertilization based on soil test recommendations': language === 'hi' ? 'मिट्टी परीक्षण सिफारिशों के आधार पर संतुलित उर्वरक प्रदान करें' : 'माती चाचणी शिफारशींवर आधारित संतुलित खत पुरवा',
      'Ensure proper drainage to prevent waterlogging, which can inhibit nutrient uptake': language === 'hi' ? 'जलभराव को रोकने के लिए उचित निकासी सुनिश्चित करें, जो पोषक तत्वों के अवशोषण को रोक सकता है' : 'जलसाचा रोखण्यासाठी योग्य निचरा सुनिश्चित करा, जो पोषक तत्व शोषणास अडथळा आणू शकतो',
      'Implement consistent and appropriate watering practices to avoid both drought and overwatering': language === 'hi' ? 'सूखे और अधिक सिंचाई दोनों से बचने के लिए लगातार और उचित सिंचाई प्रथाओं को लागू करें' : 'दुष्काळ आणि अति सिंचन दोन्ही टाळण्यासाठी सातत्यपूर्ण आणि योग्य सिंचन पद्धती अंमलात आणा',
      
      // Generic phrases
      'Apply nitrogen-rich fertilizers': language === 'hi' ? 'नाइट्रोजन युक्त उर्वरक डालें' : 'नायट्रोजन समृद्ध खते द्या',
      'Use urea, ammonium sulfate, or compost': language === 'hi' ? 'यूरिया, अमोनियम सल्फेट या खाद का उपयोग करें' : 'युरिया, अमोनियम सल्फेट किंवा कंपोस्ट वापरा',
      'Ensure proper irrigation and drainage': language === 'hi' ? 'उचित सिंचाई और जल निकासी सुनिश्चित करें' : 'योग्य सिंचन आणि निचरा सुनिश्चित करा',
      'Conduct soil testing to determine nutrient deficiencies': language === 'hi' ? 'पोषक तत्वों की कमी निर्धारित करने के लिए मिट्टी परीक्षण करें' : 'पोषक तत्वांची कमी निश्चित करण्यासाठी माती चाचणी करा',
      'Monitor plant health regularly for early intervention': language === 'hi' ? 'शीघ्र हस्तक्षेप के लिए पौधे के स्वास्थ्य की नियमित निगरानी करें' : 'लवकर हस्तक्षेपासाठी वनस्पती आरोग्याचे नियमित निरीक्षण करा',
      
      // Common words
      'e.g.': language === 'hi' ? 'जैसे' : 'उदा.',
      'iron chelate': language === 'hi' ? 'आयरन केलेट' : 'लोह केलेट',
      'magnesium sulfate': language === 'hi' ? 'मैग्नीशियम सल्फेट' : 'मॅग्नेशियम सल्फेट',
      'potassium sulfate': language === 'hi' ? 'पोटेशियम सल्फेट' : 'पोटॅशियम सल्फेट',
      'Epsom salts': language === 'hi' ? 'एप्सम सॉल्ट' : 'एप्सम मीठ',
    };
    
    let translatedText = text;
    for (const [eng, trans] of Object.entries(recTranslations)) {
      translatedText = translatedText.replace(new RegExp(eng, 'gi'), trans);
    }
    
    return translatedText;
  };

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
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 pt-16 lg:pt-0">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-8 flex items-center gap-3">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          {t.imageAnalysis.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-6">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">{t.imageAnalysis.uploadImage}</h2>
            
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
                <div className={`cursor-pointer px-4 py-2 rounded-lg transition text-center font-semibold ${
                  analyzing ? 'bg-gray-300 cursor-not-allowed text-gray-600' : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}>
                  {t.imageAnalysis.selectImage}
                </div>
              </label>

              <button
                onClick={analyzeImage}
                disabled={!selectedImage || analyzing}
                className={`flex-1 px-4 py-2 rounded-lg transition font-semibold ${
                  !selectedImage || analyzing
                    ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                    : 'bg-green-600 text-white hover:bg-green-700'
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
                ) : t.imageAnalysis.analyze}
              </button>
            </div>

            {analyzing && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 text-amber-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div>
                    <p className="text-amber-800 font-semibold">{t.imageAnalysis.aiAnalysisInProgress}</p>
                    <p className="text-amber-700 text-sm">{t.imageAnalysis.usingGemini}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-300 text-red-800 rounded-lg font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-6">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">{t.imageAnalysis.analysisResults}</h2>
            
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
                    <span className="font-medium">{t.imageAnalysis.detected}:</span> {translateDisease(result.disease_detected || result.disease_name || 'Unknown')}
                  </p>
                  {result.severity && (
                    <p className="text-sm">
                      <span className="font-medium">{t.imageAnalysis.severity}:</span> 
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getSeverityColor(result.severity)}`}>
                        {translateSeverity(result.severity)}
                      </span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">{t.imageAnalysis.confidence}:</span> {
                      typeof result.confidence === 'object' 
                        ? translateConfidence(result.confidence)
                        : `${result.confidence}%`
                    }
                  </p>
                </div>

                {/* Symptoms */}
                {result.symptoms && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">🔍 {t.imageAnalysis.symptoms}</h3>
                    <p className="text-sm text-gray-700">{translateSymptoms(result.symptoms)}</p>
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
                          <span className="text-gray-700">{translateCause(cause)}</span>
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
                            {translateSeverity(anomaly.severity)}
                          </span>
                          <span className="text-gray-700">{translateCause(anomaly.description)}</span>
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
                          <span className="font-medium">{language === 'hi' ? 'प्रमुख रंग:' : language === 'mr' ? 'प्रमुख रंग:' : 'Dominant Colors:'}</span>
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
                            <span>{language === 'hi' ? 'भूरापन' : language === 'mr' ? 'तपकिरीपणा' : 'Browning'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{result.color_analysis.has_yellowing ? '✓' : '✗'}</span>
                            <span>{language === 'hi' ? 'पीलापन' : language === 'mr' ? 'पिवळेपणा' : 'Yellowing'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{result.color_analysis.has_spots ? '✓' : '✗'}</span>
                            <span>{language === 'hi' ? 'धब्बे' : language === 'mr' ? 'डाग' : 'Spots'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {result.color_analysis.green_dominance !== undefined && (
                          <div>
                            <span className="text-gray-600">{language === 'hi' ? 'हरित प्रभुत्व:' : language === 'mr' ? 'हिरवा वर्चस्व:' : 'Green Dominance:'}</span>
                            <span className="ml-2 font-medium">{result.color_analysis.green_dominance.toFixed(2)}</span>
                          </div>
                        )}
                        {result.color_analysis.brown_tissue_pct !== undefined && (
                          <div>
                            <span className="text-gray-600">{language === 'hi' ? 'भूरा ऊतक:' : language === 'mr' ? 'तपकिरी ऊती:' : 'Brown Tissue:'}</span>
                            <span className="ml-2 font-medium">{result.color_analysis.brown_tissue_pct.toFixed(1)}%</span>
                          </div>
                        )}
                        {result.color_analysis.dark_spots_pct !== undefined && (
                          <div>
                            <span className="text-gray-600">{language === 'hi' ? 'काले धब्बे:' : language === 'mr' ? 'काळे डाग:' : 'Dark Spots:'}</span>
                            <span className="ml-2 font-medium">{result.color_analysis.dark_spots_pct.toFixed(1)}%</span>
                          </div>
                        )}
                        {result.color_analysis.yellowing_pct !== undefined && (
                          <div>
                            <span className="text-gray-600">{language === 'hi' ? 'पीलापन:' : language === 'mr' ? 'पिवळेपणा:' : 'Yellowing:'}</span>
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
                          <span>{translateRecommendation(rec)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Treatment */}
                {result.treatment && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold mb-2">🩺 {t.imageAnalysis.treatment}</h3>
                    <p className="text-sm text-gray-700">{translateRecommendation(result.treatment)}</p>
                  </div>
                )}

                {/* Prevention */}
                {result.prevention && (
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold mb-2">🛡️ {t.imageAnalysis.prevention}</h3>
                    <p className="text-sm text-gray-700">{translateRecommendation(result.prevention)}</p>
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
