# Deployment Guide: Netlify + Railway

This guide will help you deploy the Sunique Appointment System with:
- **Frontend (Netlify)**: Customer booking interface and admin portal
- **Backend (Railway)**: Python Flask API with SharePoint and email integration

## Prerequisites

1. GitHub account with this repository
2. Netlify account (free tier is sufficient)
3. Railway account (free tier available)
4. Microsoft Azure app registrations configured (see SETUP_YOUR_CREDENTIALS.md)

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select this repository

### Step 2: Configure Environment Variables

In Railway project settings, add these environment variables:

```
# Flask Configuration
SECRET_KEY=your-secret-key-here-generate-a-random-string

# Microsoft Graph API for SharePoint
CLIENT_ID=your-azure-app-client-id
CLIENT_SECRET=your-azure-app-client-secret
TENANT_ID=your-azure-tenant-id

# SharePoint Configuration
SHAREPOINT_SITE_URL=https://yourdomain.sharepoint.com/sites/YourSite
SHAREPOINT_SITE_ID=your-sharepoint-site-id
ORDERS_FILE_PATH=/path/to/orders.xlsx
APPOINTMENTS_FILE_PATH=/path/to/appointments.csv

# Microsoft Graph API for Email
OUTLOOK_CLIENT_ID=your-outlook-app-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-app-client-secret
OUTLOOK_TENANT_ID=your-azure-tenant-id
OUTLOOK_SENDER_EMAIL=info@suniquecabinetry.com

# Admin Configuration
ADMIN_PASSWORD=your-admin-password-here

# Port (Railway automatically sets this)
PORT=3000
```

### Step 3: Deploy

1. Railway will automatically detect the Python backend
2. It will use `railway.json` configuration
3. Wait for deployment to complete
4. Copy your Railway backend URL (e.g., `https://your-app.up.railway.app`)

### Step 4: Verify Backend

Test your backend:
```bash
curl https://your-app.up.railway.app/api/health
```

Should return:
```json
{"status": "healthy"}
```

## Part 2: Deploy Frontend to Netlify

### Step 1: Create Netlify Site

1. Go to [Netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select this repository
4. Configure build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `public`
   - Click "Deploy site"

### Step 2: Update Backend URL

1. Open `netlify.toml` in your repository
2. Update the redirect URL with your Railway backend URL:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-app.up.railway.app/api/:splat"
  status = 200
  force = true
```

3. Commit and push this change
4. Netlify will automatically redeploy

### Step 3: Configure Custom Domain (Optional)

1. In Netlify dashboard, go to "Domain settings"
2. Add your custom domain
3. Update DNS records as instructed
4. Enable HTTPS (automatic with Netlify)

### Step 4: Update CORS in Backend

After getting your Netlify URL, update the CORS configuration:

1. Go to Railway dashboard
2. Add environment variable:
   ```
   CORS_ORIGINS=https://your-netlify-site.netlify.app,https://your-custom-domain.com
   ```
3. Or update `python-backend/config.py` if you prefer to hardcode it

## Part 3: Verify Full System

### Test Customer Portal

1. Visit your Netlify URL
2. Enter a test order number
3. Select a time slot
4. Complete booking
5. Verify email confirmation is received

### Test Admin Portal

1. Visit `https://your-netlify-site.netlify.app/admin.html`
2. Login with your admin password
3. Verify appointments are displayed
4. Test canceling/rescheduling an appointment

## Monitoring and Logs

### Railway Logs

1. Go to Railway project
2. Click on your service
3. View logs in real-time
4. Monitor for errors or issues

### Netlify Logs

1. Go to Netlify site dashboard
2. Click "Deploys"
3. View deployment logs
4. Monitor function logs (if using Netlify Functions)

## Troubleshooting

### Backend Issues

**Problem**: 500 Internal Server Error

**Solutions**:
- Check Railway logs for Python errors
- Verify all environment variables are set
- Check SharePoint credentials and file paths
- Test SharePoint connectivity

**Problem**: CORS errors in browser console

**Solutions**:
- Add Netlify URL to CORS_ORIGINS in Railway
- Check that redirect in netlify.toml is correct
- Clear browser cache

### Frontend Issues

**Problem**: API calls fail with 404

**Solutions**:
- Verify netlify.toml redirect is correct
- Check Railway backend is running
- Test backend URL directly

**Problem**: Appointments not showing

**Solutions**:
- Check SharePoint file permissions
- Verify appointments.csv exists and is accessible
- Check Railway logs for errors

## Security Best Practices

1. **Never commit secrets**: Always use environment variables
2. **Rotate credentials**: Change passwords and secrets regularly
3. **Monitor logs**: Check for suspicious activity
4. **HTTPS only**: Ensure both frontend and backend use HTTPS
5. **Keep dependencies updated**: Regularly update packages

## Maintenance

### Update Backend

1. Push changes to GitHub
2. Railway automatically redeploys
3. Monitor logs for issues

### Update Frontend

1. Push changes to GitHub
2. Netlify automatically redeploys
3. Clear browser cache if needed

### Database Backup

1. Regularly backup SharePoint files
2. Export appointments data periodically
3. Keep backups of configuration

## Support

For issues:
1. Check Railway logs
2. Check Netlify logs
3. Review SharePoint permissions
4. Test email service connectivity
5. Verify all environment variables

## Cost Estimation

### Free Tier Limits

**Railway**:
- $5 free credit per month
- Enough for light to moderate usage

**Netlify**:
- 100GB bandwidth/month
- 300 build minutes/month
- Sufficient for most small businesses

### Scaling Considerations

If you exceed free tier limits:
- Railway: Pay-as-you-go pricing
- Netlify: Pro plan at $19/month
- Consider implementing caching
- Optimize API calls

