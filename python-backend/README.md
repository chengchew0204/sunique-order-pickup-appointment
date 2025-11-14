# Appointment System - Python Backend

Python/Flask backend for the appointment scheduling system.

## Features

- Flask REST API with all endpoints from Node.js version
- MSAL authentication for SharePoint and Outlook
- Excel/CSV file handling with pandas
- Email confirmations via Microsoft Graph API
- Compatible with Railway deployment

## Local Development

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file with environment variables:
```
CLIENT_ID=your-azure-ad-client-id
CLIENT_SECRET=your-azure-ad-client-secret
TENANT_ID=your-azure-ad-tenant-id
SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/yoursite
SHAREPOINT_SITE_ID=your-site-id
ORDERS_FILE_PATH=/path/to/orders.xlsx
APPOINTMENTS_FILE_PATH=/path/to/appointments.csv
ADMIN_PASSWORD=your-admin-password
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret
OUTLOOK_TENANT_ID=your-outlook-tenant-id
OUTLOOK_SENDER_EMAIL=your-email@domain.com
PORT=3000
```

4. Run the server:
```bash
python app.py
```

## Deploy to Railway

1. Push to GitHub
2. Create new project on Railway
3. Connect GitHub repository
4. Add environment variables in Railway dashboard
5. Railway will auto-detect Python and deploy

## API Endpoints

All endpoints match the Node.js version:

- `GET /api/health` - Health check
- `POST /api/admin/login` - Admin authentication
- `POST /api/validate-order` - Validate order
- `GET /api/available-slots` - Get available time slots
- `POST /api/book-appointment` - Book appointment
- `GET /api/admin/appointments` - Get all appointments (admin)
- `DELETE /api/admin/appointments/:orderNumber` - Cancel appointment (admin)
- `PUT /api/admin/appointments/:orderNumber` - Reschedule appointment (admin)

