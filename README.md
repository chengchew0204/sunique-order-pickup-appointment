# Appointment Scheduling System

A web-based appointment system that allows customers to schedule pickup times for orders, integrated with SharePoint/OneDrive CSV file.

## Features

- Order validation against CSV file
- Time slot booking (Mon-Fri, 9:00 AM - 5:00 PM, 30-minute intervals)
- Double-booking prevention
- SharePoint/OneDrive integration
- Responsive design

## Setup

### Prerequisites

- Node.js (v14 or higher)
- Azure AD app registration with Microsoft Graph API permissions
- Access to SharePoint/OneDrive CSV file

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with:
   - Azure AD credentials (CLIENT_ID, CLIENT_SECRET, TENANT_ID)
   - SharePoint site URL and CSV file path

### Azure AD App Registration

1. Go to Azure Portal > Azure Active Directory > App registrations
2. Create new registration
3. Add API permissions: Microsoft Graph > Application permissions > Sites.ReadWrite.All
4. Create a client secret
5. Grant admin consent for permissions

### Running Locally

```bash
npm start
```

Server will run on `http://localhost:3000`

## Deployment

### Backend (Railway)

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Railway will auto-deploy on push

### Frontend (Netlify)

1. Connect your GitHub repository to Netlify
2. Set publish directory to `public/`
3. Update API URL in `public/app.js` to your Railway backend URL
4. Netlify will auto-deploy on push

## CSV Format

The system expects a CSV file with the following columns:

- `Order_Number`: Unique order identifier
- `Status`: Order status (e.g., "Ready to Pickup")
- `Pickup_Time`: Scheduled pickup time (ISO 8601 format, added by system)

## API Endpoints

- `POST /api/validate-order`: Validate order number and status
- `GET /api/available-slots`: Get available time slots
- `POST /api/book-appointment`: Book an appointment slot

## License

ISC

