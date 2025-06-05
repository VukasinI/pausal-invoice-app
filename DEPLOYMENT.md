# Deployment Guide

## Free Hosting on Render

### Prerequisites
1. Create a GitHub repository for your project
2. Push all code to GitHub
3. Create a free account at [Render.com](https://render.com)

### Quick Deploy
1. **Connect GitHub**: Link your GitHub account to Render
2. **Import Repository**: Select your pausal-invoice-app repository
3. **Auto-Deploy**: Render will automatically detect the `render.yaml` and deploy both services

### Manual Setup (Alternative)

#### Backend API
1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `pausal-invoice-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`

#### Frontend App
1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository
3. Configure:
   - **Name**: `pausal-invoice-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Plan**: Free
4. Add Environment Variable:
   - `REACT_APP_API_URL`: `https://pausal-invoice-backend.onrender.com/api`

### After Deployment
- Backend will be available at: `https://pausal-invoice-backend.onrender.com`
- Frontend will be available at: `https://pausal-invoice-frontend.onrender.com`
- Database (SQLite) will persist across deployments

### Alternative Free Hosting Options

#### Railway
- Supports both frontend and backend
- PostgreSQL database available
- Good free tier

#### Vercel + Railway
- Vercel for frontend (excellent React support)
- Railway for backend + database

#### Netlify + Railway
- Netlify for frontend
- Railway for backend + database

### Notes
- Free tier services may sleep after 15 minutes of inactivity
- First request after sleeping may take 30+ seconds
- For production use, consider paid tiers for better performance