# Deployment Guide

This guide walks you through deploying the Appointment System to Netlify (frontend) and Railway (backend).

## Prerequisites

1. GitHub account
2. Netlify account
3. Railway account
4. Azure AD app registration with Microsoft Graph API access

## Step 1: Prepare Your Repository

1. Create a new GitHub repository
2. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

## Step 2: Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app) and sign in
2. Click "New Project" > "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Node.js project

### Configure Environment Variables

In your Railway project dashboard, add these environment variables:

```
CLIENT_ID=<your-azure-ad-client-id>
CLIENT_SECRET=<your-azure-ad-client-secret>
TENANT_ID=<your-azure-ad-tenant-id>
SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/yoursite
CSV_FILE_PATH=/path/to/your/orders.csv
PORT=3000
```

### Get Your Railway Backend URL

1. Once deployed, Railway will provide a URL like: `https://your-app.up.railway.app`
2. Copy this URL - you'll need it for the frontend deployment

### Test Backend

Visit `https://your-app.up.railway.app/api/health` to verify the backend is running.

## Step 3: Update Frontend Configuration

Before deploying to Netlify, update the API URL in `public/app.js`:

```javascript
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://your-app.up.railway.app/api'; // Replace with your Railway URL
```

Commit and push this change:
```bash
git add public/app.js
git commit -m "Update API URL for production"
git push
```

## Step 4: Deploy Frontend to Netlify

1. Go to [Netlify](https://www.netlify.com/) and sign in
2. Click "Add new site" > "Import an existing project"
3. Choose "Deploy with GitHub"
4. Select your repository

### Build Settings

- **Build command:** Leave empty (no build needed)
- **Publish directory:** `public`
- **Branch to deploy:** `main`

### Update netlify.toml

Before deploying, update `netlify.toml` with your Railway backend URL:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-app.up.railway.app/api/:splat"
  status = 200
  force = true
```

### Deploy

Click "Deploy site". Netlify will:
1. Pull your code from GitHub
2. Deploy the `public` folder
3. Provide a URL like: `https://random-name-123.netlify.app`

### Custom Domain (Optional)

1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow instructions to configure DNS

## Step 5: Update CORS Settings

Update your backend CORS configuration to allow your Netlify domain.

In `server/config.js`, update the `corsOptions`:

```javascript
corsOptions: {
  origin: [
    'http://localhost:3000',
    'https://your-site.netlify.app',
    // Add your custom domain if you have one
  ],
  optionsSuccessStatus: 200
}
```

Commit and push:
```bash
git add server/config.js
git commit -m "Update CORS for production"
git push
```

Railway will automatically redeploy with the new settings.

## Step 6: Azure AD App Configuration

Ensure your Azure AD app has the correct redirect URIs and permissions:

1. Go to Azure Portal > Azure Active Directory > App registrations
2. Select your app
3. Under "API permissions", ensure you have:
   - Microsoft Graph > Application permissions > Sites.ReadWrite.All
   - Grant admin consent
4. Under "Certificates & secrets", verify your client secret is active

## Step 7: SharePoint File Configuration

1. Ensure your CSV file exists in SharePoint
2. The file path should be accessible via the service account
3. Test file access using Microsoft Graph Explorer if needed

## Step 8: Test the Complete System

1. Visit your Netlify URL
2. Enter a test order number
3. Verify:
   - Order validation works
   - Time slots load correctly
   - Booking saves to CSV
   - Error handling works properly

## Troubleshooting

### Backend Issues

- Check Railway logs: Railway Dashboard > Your Project > Deployments > View logs
- Verify environment variables are set correctly
- Test API endpoints directly: `curl https://your-app.up.railway.app/api/health`

### Frontend Issues

- Check browser console for errors
- Verify API URL in `app.js` matches Railway URL
- Check Netlify function logs if using redirects

### CORS Errors

- Ensure backend CORS settings include your Netlify domain
- Check that requests are going to the correct URL
- Verify Railway backend is accepting requests

### SharePoint Access Issues

- Verify Azure AD app has correct permissions
- Check that CLIENT_ID, CLIENT_SECRET, and TENANT_ID are correct
- Ensure SharePoint site URL and file path are correct
- Test authentication using Microsoft Graph Explorer

## Automatic Deployments

Both Railway and Netlify support automatic deployments:

- **Railway**: Auto-deploys on push to `main` branch
- **Netlify**: Auto-deploys on push to `main` branch

Simply push your changes to GitHub and both services will redeploy automatically.

## Monitoring

### Railway
- View logs in Railway dashboard
- Monitor CPU and memory usage
- Set up alerts for downtime

### Netlify
- View deploy logs
- Monitor bandwidth usage
- Set up deploy notifications

## Cost Considerations

### Railway
- Free tier: Limited hours per month
- Paid plans start at $5/month for more resources

### Netlify
- Free tier: 100GB bandwidth/month
- Paid plans for more bandwidth and features

## Security Best Practices

1. Never commit `.env` files to Git
2. Rotate Azure AD client secrets regularly
3. Use HTTPS for all connections
4. Enable Railway's built-in DDoS protection
5. Monitor access logs for unusual activity
6. Keep dependencies updated

## Support

If you encounter issues:
- Railway: https://docs.railway.app
- Netlify: https://docs.netlify.com
- Microsoft Graph API: https://docs.microsoft.com/graph

