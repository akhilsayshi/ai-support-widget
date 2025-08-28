# Free Deployment Guide

Deploy your AI Support Widget tutorial for **$0/month** using free hosting services.

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - Full Stack)

1. **Create account**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Link your repository
3. **Deploy**: Railway auto-detects Python and deploys
4. **Get URL**: Your API will be live at `https://your-app.railway.app`

**Free tier**: $5 credit per month (usually sufficient for tutorials)

### Option 2: Render (Python Backend)

1. **Create account**: Go to [render.com](https://render.com)
2. **New Web Service**: Connect your GitHub repo
3. **Auto-deploy**: Uses included `render.yaml` configuration
4. **Free tier**: 750 hours/month free

### Option 3: Netlify (Demo Page Only)

1. **Drag & Drop**: Go to [netlify.com](https://netlify.com)
2. **Upload folder**: Drag your `demo` folder to Netlify
3. **Instant deploy**: Get `https://your-site.netlify.app`
4. **100% Free**: Perfect for tutorial demo

### Option 4: GitHub Pages (Static Demo)

1. **Push to GitHub**: Upload your code
2. **Settings → Pages**: Enable GitHub Pages
3. **Select source**: Choose main branch
4. **Access**: `https://username.github.io/repo-name`

## 🔧 Deployment Steps

### For Railway (Full App):

```bash
# 1. Push your code to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Connect to Railway
# - Go to railway.app
# - "New Project" → "Deploy from GitHub"
# - Select your repository
# - Railway automatically detects Python and deploys

# 3. Set environment variables (optional)
# In Railway dashboard:
# - OPENAI_API_KEY (if using AI)
# - PINECONE_API_KEY (if using vector search)
```

### For Netlify (Demo Only):

```bash
# 1. Build static demo
cd ai-support-widget

# 2. Update demo/index.html
# Change "http://localhost:8000" to your Railway API URL

# 3. Deploy to Netlify
# - Go to netlify.com
# - Drag the 'demo' folder to Netlify
# - Your demo is live!
```

## 🌐 Production Configuration

### Update API URLs

**In demo/index.html:**
```javascript
// Change from:
"apiUrl": "http://localhost:8000"

// To your deployed API:
"apiUrl": "https://your-app.railway.app"
```

**In test-widget.html:**
```javascript
// Update the same apiUrl configuration
```

### Environment Variables

Set these in your hosting platform:

```bash
# Required for basic functionality
PORT=8000
ENVIRONMENT=production

# Optional for AI features
OPENAI_API_KEY=sk-your-key-here
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-west1-gcp

# Optional for security
ALLOWED_ORIGINS=https://yourdomain.com
```

## 💰 Cost Breakdown

### Free Forever:
- ✅ **Demo hosting**: $0 (Netlify/GitHub Pages)
- ✅ **Backend hosting**: $0 (Railway/Render free tier)
- ✅ **FAQ responses**: $0 (no external APIs)
- ✅ **SSL certificates**: $0 (included)
- ✅ **Custom subdomains**: $0 (yourapp.netlify.app)

### Pay-as-you-use (Optional):
- 🔹 **OpenAI API**: ~$0.01 per conversation
- 🔹 **Custom domain**: ~$10/year
- 🔹 **Pinecone Pro**: $70/month (only if you need more than 1M vectors)

## 🎯 Recommended Free Stack

**For Tutorial/Demo:**
1. **Railway** - Backend API (free $5 credit)
2. **Netlify** - Demo page (free)
3. **FAQ only** - No AI APIs needed (free)

**Total: $0/month** 🎉

## 🔧 Troubleshooting

### Common Issues:

**CORS Errors:**
```python
# In main.py, update CORS origins:
allow_origins=["https://your-demo-site.netlify.app"]
```

**API Not Responding:**
- Check Railway logs for Python errors
- Ensure requirements.txt includes all dependencies
- Verify PORT environment variable is set

**Widget Not Loading:**
- Update apiUrl in embed script
- Check browser console for JavaScript errors
- Ensure HTTPS is used for production

## 📱 Mobile-Friendly

The widget is automatically mobile-responsive and works perfectly on:
- ✅ Desktop browsers
- ✅ Mobile phones  
- ✅ Tablets
- ✅ All modern browsers

## 🔄 Auto-Deploy Setup

**Railway Auto-Deploy:**
1. Connect GitHub repository
2. Enable auto-deploy on push
3. Every git push automatically updates your live site

**Netlify Auto-Deploy:**
1. Connect GitHub repository  
2. Set build command: `# none needed for static`
3. Set publish directory: `demo`
4. Auto-deploys on every push

Your tutorial is now live and updating automatically! 🚀
