# API Keys Configuration for Deployment

## 📋 Overview
This guide explains how to add API keys for your deployed application (Render/Heroku/etc.)

## 🔑 Required API Keys

### 1. **Weather API** (WeatherAPI.com)
- **Current Key**: `079a0828828c4c57af2133300262401`
- **Usage**: Get real-time weather data (temperature, humidity, conditions)
- **Free tier**: ✅ Yes (1 million calls/month)
- **Get your own key**: [https://www.weatherapi.com/signup.aspx](https://www.weatherapi.com/signup.aspx)

### 2. **Soil Monitoring API** (AgroMonitoring)
- **Current Key**: `97f32bc1c704c19fbb76c734b0c127b6`
- **Usage**: Get soil moisture and temperature data
- **Free tier**: ✅ Yes (Limited calls/day)
- **Get your own key**: [https://agromonitoring.com/api](https://agromonitoring.com/api)

### 3. **NPK Sensor API**
- **Current URL**: `https://npk-agriculture-api.onrender.com`
- **Usage**: Get NPK (Nitrogen, Phosphorus, Potassium) readings
- **Free tier**: ✅ Yes (Public API)
- **No key required**: This is a public endpoint

### 4. **MongoDB Atlas**
- **Current Connection**: `mongodb+srv://farmadmin:LywXhayZ9NVy5F9W@cluster0.yvhrlwn.mongodb.net/FarmAi`
- **Usage**: Database for storing sensor data, predictions, and actions
- **Free tier**: ✅ Yes (512 MB storage)
- **Get your own**: [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)

### 5. **Google Gemini AI** (for image analysis)
- **Current Key**: `AIzaSyAIKp_OOJ4czkQrm5KtRiLUDMxQM6ybiaQ`
- **Usage**: AI-powered crop disease detection from images
- **Free tier**: ✅ Yes (60 requests/minute)
- **Get your own**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

---

## 🚀 How to Add Keys on Render

### For Backend (Python/Flask)

1. **Go to your Render Dashboard**
   - Navigate to: [https://dashboard.render.com/](https://dashboard.render.com/)
   - Select your backend service

2. **Click on "Environment"** tab

3. **Add these Environment Variables:**

```bash
# External APIs
WEATHER_API_KEY=079a0828828c4c57af2133300262401
AGRO_API_KEY=97f32bc1c704c19fbb76c734b0c127b6
NPK_API_URL=https://npk-agriculture-api.onrender.com

# MongoDB
MONGODB_URI=mongodb+srv://farmadmin:LywXhayZ9NVy5F9W@cluster0.yvhrlwn.mongodb.net/FarmAi?appName=Cluster0
MONGODB_DATABASE=FarmAi

# Flask Configuration
FLASK_PORT=5000
FLASK_ENV=production
PORT=10000

# Google AI
GOOGLE_API_KEY=AIzaSyAIKp_OOJ4czkQrm5KtRiLUDMxQM6ybiaQ
```

4. **Save Changes** - Render will automatically redeploy

### For Frontend (React/Vite)

1. **Go to your Render/Netlify/Vercel Dashboard**
   - Select your frontend service

2. **Add these Environment Variables:**

```bash
# Backend API URL (update with your actual backend URL)
VITE_API_URL=https://your-backend-app.onrender.com
```

---

## 🔧 For Local Development

Your `.env` files are already configured:

### Backend `.env` (already set)
```bash
MONGODB_URI=mongodb+srv://farmadmin:LywXhayZ9NVy5F9W@cluster0.yvhrlwn.mongodb.net/FarmAi?appName=Cluster0
MONGODB_DATABASE=FarmAi
FLASK_PORT=5000
FLASK_DEBUG=True

# External API Configuration
WEATHER_API_KEY=079a0828828c4c57af2133300262401
AGRO_API_KEY=97f32bc1c704c19fbb76c734b0c127b6
NPK_API_URL=https://npk-agriculture-api.onrender.com

# AI Vision Service - Google Gemini
GOOGLE_API_KEY=AIzaSyAIKp_OOJ4czkQrm5KtRiLUDMxQM6ybiaQ
```

### Frontend `.env` (if needed)
```bash
VITE_API_URL=http://localhost:5000
```

---

## ⚠️ Security Best Practices

1. **Never commit `.env` files** to Git
   - Already in `.gitignore`: ✅

2. **Rotate Keys Regularly**
   - Change keys every 3-6 months
   - Use different keys for production vs development

3. **Use Render's Secret Files** (Optional)
   - For sensitive data, use Render's "Secret Files" feature
   - Go to Settings > Secret Files > Add

4. **Monitor API Usage**
   - Check WeatherAPI dashboard: [https://www.weatherapi.com/my/](https://www.weatherapi.com/my/)
   - Check AgroMonitoring usage: [https://home.openweathermap.org/api_keys](https://home.openweathermap.org/api_keys)

---

## 🧪 Testing API Keys

After deployment, test each endpoint:

```bash
# Test Weather API
curl "https://your-backend.onrender.com/api/external/weather?location=mumbai"

# Test Soil API
curl "https://your-backend.onrender.com/api/external/soil?lat=18.975&lon=72.826"

# Test NPK API
curl "https://your-backend.onrender.com/api/external/npk"

# Test All APIs at once
curl "https://your-backend.onrender.com/api/external/all"

# Test Health Endpoint
curl "https://your-backend.onrender.com/api/health"
```

---

## 🆘 Troubleshooting

### Issue: APIs not working on Render

**Solution 1**: Check environment variables
```bash
# In Render Dashboard > Environment
# Ensure all keys are set WITHOUT quotes
# ✅ Correct: WEATHER_API_KEY=abc123
# ❌ Wrong: WEATHER_API_KEY="abc123"
```

**Solution 2**: Check logs
```bash
# In Render Dashboard > Logs
# Look for these messages:
"✅ Crop Predictor initialized successfully"
"✅ Irrigation & Fertilizer Predictor initialized successfully"
```

**Solution 3**: Redeploy
```bash
# In Render Dashboard
# Click "Manual Deploy" > "Deploy latest commit"
```

### Issue: CORS errors in browser

**Solution**: Backend proxy endpoints handle CORS automatically
- All external API calls go through backend (`/api/external/*`)
- Frontend has fallback to direct API if proxy fails

---

## 📊 API Rate Limits

| API | Free Tier | Rate Limit |
|-----|-----------|------------|
| WeatherAPI | ✅ 1M calls/month | ~33,000/day |
| AgroMonitoring | ✅ Limited | ~1,000/day |
| NPK Agriculture | ✅ Unlimited | No limit |
| Google Gemini | ✅ 60/min | 60/minute |
| MongoDB Atlas | ✅ 512 MB | No query limit |

---

## 🎯 Next Steps

1. ✅ **Code pushed to GitHub** - Done!
2. **Deploy Backend to Render**
   - Add all environment variables listed above
3. **Deploy Frontend to Netlify/Vercel**
   - Set `VITE_API_URL` to your Render backend URL
4. **Test all endpoints** using curl commands above
5. **Monitor API usage** in respective dashboards

---

## 📞 Support

If you face issues:
1. Check Render logs for errors
2. Verify all environment variables are set
3. Test endpoints using curl/Postman
4. Check MongoDB connection status

**All API keys are already configured in your code! Just copy them to Render's environment variables. 🚀**
