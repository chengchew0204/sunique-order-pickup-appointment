# Quick Start Guide

Get the Appointment System running in 5 minutes.

## Prerequisites

- Node.js v14 or higher installed
- Azure AD app registration (see AZURE_SETUP.md for detailed steps)
- SharePoint/OneDrive access with a CSV file

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
CLIENT_ID=your-azure-ad-client-id
CLIENT_SECRET=your-azure-ad-client-secret
TENANT_ID=your-azure-ad-tenant-id
SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/yoursite
CSV_FILE_PATH=/Shared Documents/orders.csv
PORT=3000
```

## Step 3: Prepare CSV File

Your CSV file in SharePoint should have these columns:

```csv
Order_Number,Status,Pickup_Time
1001,Ready to Pickup,
1002,In Progress,
1003,Ready to Pickup,
```

- `Order_Number`: Unique identifier
- `Status`: Must be "Ready to Pickup" for booking
- `Pickup_Time`: Will be filled automatically (leave empty)

You can use the `sample-orders.csv` file as a template.

## Step 4: Start the Server

```bash
npm start
```

You should see:

```
Appointment system server running on port 3000
Health check: http://localhost:3000/api/health
```

## Step 5: Test the Application

Open your browser to:

```
http://localhost:3000
```

1. Enter an order number from your CSV (e.g., "1001")
2. Click "Validate Order"
3. Select a time slot
4. Click "Confirm Booking"

Done! The appointment is saved to your CSV file.

## Troubleshooting

### Error: "Failed to fetch CSV file"

**Solution**: Check your Azure AD credentials and SharePoint URLs in `.env`

### Error: "Order not found"

**Solution**: Verify the order number exists in your CSV file

### Error: "Insufficient privileges"

**Solution**: Ensure admin consent was granted for API permissions (see AZURE_SETUP.md)

### Port already in use

**Solution**: Change PORT in `.env` or kill the process using port 3000:

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Next Steps

- **Production Deployment**: See DEPLOYMENT.md
- **Azure Setup Details**: See AZURE_SETUP.md
- **Testing Guide**: See TESTING.md
- **Full Documentation**: See README.md

## Need Help?

Check these files for detailed information:
- `AZURE_SETUP.md` - Azure AD configuration
- `DEPLOYMENT.md` - Deployment to Netlify + Railway
- `TESTING.md` - Testing scenarios and API examples
- `README.md` - Complete system documentation

