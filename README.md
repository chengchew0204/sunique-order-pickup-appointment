# Sunique Appointment Scheduling System

A professional web-based appointment system that allows customers to schedule pickup times for orders, integrated with SharePoint for data management and Outlook for email notifications.

## Architecture

- **Frontend**: Static HTML/CSS/JavaScript hosted on Netlify
- **Backend**: Python Flask API hosted on Railway
- **Data Storage**: SharePoint (Excel for orders, CSV for appointments)
- **Email**: Microsoft Outlook via Graph API

## Features

### Customer Portal
- Order number validation
- Interactive calendar view for available time slots
- Real-time availability checking
- Email confirmation notifications
- Mobile-responsive design

### Admin Portal
- Secure password-protected access
- Calendar and list views of all appointments
- Search and filter functionality
- Cancel and reschedule appointments
- Manual appointment booking
- Real-time appointment management

### Technical Features
- Double-booking prevention with slot locking
- SharePoint integration for persistent storage
- Email notifications for all appointment actions
- CORS-enabled API for cross-origin requests
- Error handling and logging
- Automatic time slot generation

## Quick Start

### For Deployment

See **[DEPLOYMENT_GUIDE.md](doc/DEPLOYMENT_GUIDE.md)** for comprehensive deployment instructions.

Use **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** to track your deployment progress.

### For Local Development

#### Backend Setup

1. Navigate to the Python backend directory:
   ```bash
   cd python-backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Configure your `.env` file with Azure credentials (see SETUP_YOUR_CREDENTIALS.md)

6. Run the Flask app:
   ```bash
   python app.py
   ```

Backend will run on `http://localhost:3000`

#### Frontend Setup

1. Open `public/index.html` in a browser, or
2. Use a local server:
   ```bash
   python -m http.server 8000 --directory public
   ```

Visit `http://localhost:8000`

## Prerequisites

- Python 3.9 or higher
- Azure AD app registrations with Microsoft Graph API permissions
- Access to SharePoint site and files
- Access to Outlook/Microsoft 365 for email

## Azure AD Configuration

You need TWO Azure App Registrations:

### 1. SharePoint Access App
- API Permissions: `Sites.ReadWrite.All`
- Type: Application permissions
- Admin consent required

### 2. Email/Outlook App
- API Permissions: `Mail.Send`
- Type: Application permissions  
- Admin consent required

See **[SETUP_YOUR_CREDENTIALS.md](doc/SETUP_YOUR_CREDENTIALS.md)** for detailed setup instructions.

## File Structure

```
/
├── public/                  # Frontend files (deployed to Netlify)
│   ├── index.html          # Customer booking portal
│   ├── admin.html          # Admin management portal
│   ├── app.js              # Customer portal logic
│   ├── admin.js            # Admin portal logic
│   ├── calendar.js         # Calendar UI component
│   └── styles.css          # Styling
│
├── python-backend/         # Backend API (deployed to Railway)
│   ├── app.py             # Main Flask application
│   ├── config.py          # Configuration management
│   ├── requirements.txt   # Python dependencies
│   ├── Procfile          # Railway deployment config
│   ├── runtime.txt       # Python version specification
│   └── services/
│       ├── sharepoint_service.py  # SharePoint integration
│       └── email_service.py       # Email notifications
│
├── doc/                    # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SETUP_YOUR_CREDENTIALS.md
│   └── ...
│
├── netlify.toml           # Netlify configuration
├── railway.json           # Railway configuration
└── README.md             # This file
```

## Data Format

### Orders File (Excel - .xlsx)
Located in SharePoint, contains:
- `Order Number`: Unique identifier
- `Status`: Order status
- Other order details

### Appointments File (CSV)
Located in SharePoint, contains:
- `Order Number`: Links to order
- `Pickup Time`: ISO 8601 datetime
- `Customer Email`: For notifications
- `Status`: active/cancelled

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/validate-order` - Validate order number
- `GET /api/available-slots` - Get available time slots
- `POST /api/book-appointment` - Book an appointment

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/appointments` - List all appointments
- `POST /api/admin/cancel-appointment` - Cancel appointment
- `POST /api/admin/reschedule-appointment` - Reschedule appointment
- `POST /api/admin/add-appointment` - Manually add appointment

## Time Slot Configuration

Default settings (configurable in `python-backend/config.py`):
- **Hours**: 9:00 AM - 5:00 PM
- **Interval**: 30 minutes
- **Days**: Monday - Friday
- **Booking window**: 15 days ahead

## Environment Variables

### Required for Backend (Railway)

```bash
# Flask
SECRET_KEY=your-secret-key

# SharePoint Access
CLIENT_ID=your-sharepoint-app-id
CLIENT_SECRET=your-sharepoint-app-secret
TENANT_ID=your-tenant-id
SHAREPOINT_SITE_URL=https://yourdomain.sharepoint.com/sites/YourSite
SHAREPOINT_SITE_ID=your-site-id
ORDERS_FILE_PATH=/path/to/orders.xlsx
APPOINTMENTS_FILE_PATH=/path/to/appointments.csv

# Email/Outlook
OUTLOOK_CLIENT_ID=your-email-app-id
OUTLOOK_CLIENT_SECRET=your-email-app-secret
OUTLOOK_TENANT_ID=your-tenant-id
OUTLOOK_SENDER_EMAIL=info@suniquecabinetry.com

# Admin
ADMIN_PASSWORD=your-admin-password
```

## Deployment

### Production Deployment
1. Deploy backend to Railway (Python Flask API)
2. Deploy frontend to Netlify (Static files)
3. Configure environment variables on Railway
4. Update `netlify.toml` with Railway backend URL
5. Test all functionality

See **[DEPLOYMENT_GUIDE.md](doc/DEPLOYMENT_GUIDE.md)** for step-by-step instructions.

### Deployment Checklist
Use **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** to ensure everything is configured correctly.

## Security

- All secrets stored as environment variables
- HTTPS enforced on both frontend and backend
- Admin portal password-protected
- CORS properly configured
- Security headers set via Netlify
- SharePoint access via secure OAuth2 tokens

## Support & Documentation

- **[DEPLOYMENT_GUIDE.md](doc/DEPLOYMENT_GUIDE.md)** - Complete deployment walkthrough
- **[SETUP_YOUR_CREDENTIALS.md](doc/SETUP_YOUR_CREDENTIALS.md)** - Azure setup guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Deployment verification
- **[doc/](doc/)** - Additional technical documentation

## Troubleshooting

### Common Issues

**CORS Errors**: Add your Netlify URL to CORS_ORIGINS in Railway environment variables

**500 Errors**: Check Railway logs for Python exceptions, verify SharePoint credentials

**Emails Not Sending**: Verify Outlook app permissions and credentials

**Orders Not Found**: Check ORDERS_FILE_PATH and SharePoint file permissions

See deployment guide for more troubleshooting tips.

## License

ISC

