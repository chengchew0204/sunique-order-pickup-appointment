# Quick Start Guide

Get the Sunique Appointment System up and running in minutes.

## Option 1: Deploy to Production (Recommended)

### Step 1: Deploy Backend to Railway (10 minutes)

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Railway will detect the Python backend automatically
5. Go to "Variables" tab and add all environment variables (see `.env.example`)
6. Wait for deployment to complete
7. Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

**Environment Variables Needed**:
```bash
SECRET_KEY=generate-a-random-string-here
CLIENT_ID=your-sharepoint-app-id
CLIENT_SECRET=your-sharepoint-app-secret
TENANT_ID=your-azure-tenant-id
SHAREPOINT_SITE_URL=https://yourdomain.sharepoint.com/sites/YourSite
SHAREPOINT_SITE_ID=your-site-id
ORDERS_FILE_PATH=/path/to/orders.xlsx
APPOINTMENTS_FILE_PATH=/path/to/appointments.csv
OUTLOOK_CLIENT_ID=your-email-app-id
OUTLOOK_CLIENT_SECRET=your-email-app-secret
OUTLOOK_TENANT_ID=your-tenant-id
OUTLOOK_SENDER_EMAIL=info@suniquecabinetry.com
ADMIN_PASSWORD=your-secure-password
```

### Step 2: Deploy Frontend to Netlify (5 minutes)

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select this repository
4. Configure:
   - Build command: (leave empty)
   - Publish directory: `public`
5. Click "Deploy site"
6. After deployment, get your Netlify URL

### Step 3: Connect Frontend and Backend (2 minutes)

1. Open `netlify.toml` in your repository
2. Update line 3 with your Railway URL:
   ```toml
   to = "https://your-railway-app.up.railway.app/api/:splat"
   ```
3. Commit and push the change
4. Netlify will automatically redeploy

### Step 4: Update CORS (1 minute)

1. Go to Railway dashboard
2. Add your Netlify URL to environment variables
3. Railway will automatically redeploy

### Step 5: Test (5 minutes)

1. Visit your Netlify URL
2. Try booking an appointment with a test order
3. Visit `/admin.html` and login with your admin password
4. Verify appointments are showing

**Done!** Your system is live.

---

## Option 2: Run Locally for Development

### Prerequisites
- Python 3.9+
- Git
- Azure app registrations set up

### Step 1: Clone and Setup (5 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd 07-appointment-system

# Set up Python backend
cd python-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

### Step 2: Configure Environment (10 minutes)

Edit `python-backend/.env` with your Azure credentials:

```bash
# Get these from Azure Portal
CLIENT_ID=...
CLIENT_SECRET=...
TENANT_ID=...
SHAREPOINT_SITE_URL=...
SHAREPOINT_SITE_ID=...
# ... etc (see .env.example for all variables)
```

Need help with Azure setup? See [SETUP_YOUR_CREDENTIALS.md](doc/SETUP_YOUR_CREDENTIALS.md)

### Step 3: Test Configuration (1 minute)

```bash
# Verify all environment variables are set
python test_config.py
```

If you see all green checkmarks, you're ready!

### Step 4: Run Backend (1 minute)

```bash
# Make sure you're in python-backend directory with venv activated
python app.py
```

Backend will run on `http://localhost:3000`

### Step 5: Run Frontend (1 minute)

Open a new terminal:

```bash
# Option 1: Simple Python server
cd public
python -m http.server 8000

# Option 2: Just open in browser
# Open public/index.html directly in your browser
```

Visit `http://localhost:8000` (or open the file directly)

### Step 6: Test Locally (5 minutes)

1. Open `http://localhost:8000` in your browser
2. Enter a test order number
3. Try booking an appointment
4. Open `http://localhost:8000/admin.html`
5. Login and verify appointments

---

## Troubleshooting

### "Module not found" error
```bash
cd python-backend
pip install -r requirements.txt
```

### "Environment variable not set" error
- Make sure `.env` file exists in `python-backend/` directory
- Run `python test_config.py` to check which variables are missing
- See `.env.example` for required variables

### CORS errors in browser
- If running locally, make sure backend is on port 3000
- Check that `API_BASE_URL` in `public/app.js` is correct

### SharePoint connection fails
- Verify your CLIENT_ID, CLIENT_SECRET, and TENANT_ID
- Check that API permissions are granted in Azure Portal
- Ensure admin consent is given for the permissions
- Verify SHAREPOINT_SITE_ID is correct

### Emails not sending
- Verify OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET
- Check that Mail.Send permission is granted
- Ensure admin consent is given

---

## Next Steps

Once you have it running:

1. **Deploy to production**: See [DEPLOYMENT_GUIDE.md](doc/DEPLOYMENT_GUIDE.md)
2. **Customize time slots**: Edit `python-backend/config.py`
3. **Change styling**: Edit `public/styles.css` and `public/admin.css`
4. **Set up monitoring**: Check Railway and Netlify dashboards

---

## Quick Links

- **Full Deployment Guide**: [DEPLOYMENT_GUIDE.md](doc/DEPLOYMENT_GUIDE.md)
- **Azure Setup**: [SETUP_YOUR_CREDENTIALS.md](doc/SETUP_YOUR_CREDENTIALS.md)
- **Deployment Checklist**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Project Overview**: [README.md](README.md)

---

## Support

If you run into issues:
1. Check the error message in terminal/browser console
2. Verify environment variables with `python test_config.py`
3. Check Railway/Netlify logs if deployed
4. Review the troubleshooting section in [DEPLOYMENT_GUIDE.md](doc/DEPLOYMENT_GUIDE.md)

