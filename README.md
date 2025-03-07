# Inspirational Quotes App

A beautiful, modern quotes application with dynamic backgrounds and daily inspiration.

## Deploying to Netlify

1. **Connect to Netlify**
   - Push your code to GitHub
   - Log in to Netlify
   - Click "New site from Git"
   - Choose your repository

2. **Environment Variables**
   Add these in Netlify's dashboard under Site Settings > Build & Deploy > Environment:
   ```
   UNSPLASH_ACCESS_KEY=your_unsplash_key_here
   ```

3. **Build Settings**
   These are already configured in `netlify.toml`:
   - Build command: Not required (static site)
   - Publish directory: "."
   - Functions directory: "netlify/functions"

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```
   UNSPLASH_ACCESS_KEY=your_unsplash_key_here
   ```

3. Run locally:
   ```bash
   npx netlify-cli dev
   ```

## Features
- Daily inspirational quotes
- Dynamic backgrounds from Unsplash
- Gradient fallbacks when images aren't available
- Favorite quotes storage
- Share functionality
- Modern, responsive design
- Smooth animations and transitions

## Security Features
- Environment variables for API keys
- Serverless functions to protect API keys
- Automatic HTTPS by Netlify
- Content Security Policy headers
- Rate limiting on API endpoints
