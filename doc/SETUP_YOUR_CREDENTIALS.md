# Setup Your SharePoint Credentials

## Quick Setup (3 Steps)

Your SharePoint credentials have been pre-configured! Follow these steps:

### Step 1: Copy the Configuration File

```bash
cp .env.sunique .env
```

This file already contains your SharePoint credentials:
- **Tenant ID**: 2697b6a6-c757-4a49-b571-b4f3297efb07
- **Client ID**: ffaf83f4-6c92-4035-a1e4-36bea3e9ed43
- **Site**: https://suniquecabinetry.sharepoint.com/sites/sccr

### Step 2: Find Your CSV File Path

You need to find where your orders CSV file is located in SharePoint.

**Option A: Use the Test Script (Recommended)**

```bash
npm install
node test-sharepoint.js
```

This script will:
- ✅ Test your SharePoint connection
- 📁 List all document libraries
- 📄 Show files in your site
- 🔍 Help you find the correct CSV path

**Option B: Find Manually in SharePoint**

1. Go to: https://suniquecabinetry.sharepoint.com/sites/sccr
2. Navigate to your CSV file
3. Click the three dots (...) next to the file
4. Click "Details"
5. Note the path (e.g., `/Shared Documents/orders.csv`)

See `FIND_CSV_PATH.md` for detailed instructions.

### Step 3: Update the CSV Path

Edit `.env` and update the `CSV_FILE_PATH` line:

```env
CSV_FILE_PATH=/Shared Documents/orders.csv
```

Replace with your actual path.

## Test Your Setup

```bash
# Start the server
npm start

# In another terminal, test the connection
curl http://localhost:3000/api/health
```

If successful, you'll see:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## Your CSV File Format

Your CSV file should have these columns:

```csv
Order_Number,Status,Pickup_Time
1001,Ready to Pickup,
1002,In Progress,
1003,Ready to Pickup,
```

- **Order_Number**: Unique order identifier
- **Status**: Must be "Ready to Pickup" for customers to book
- **Pickup_Time**: Leave empty - the system fills this automatically

You can use `sample-orders.csv` as a template.

## Troubleshooting

### Test Script Shows Errors?

Run the test script to diagnose:
```bash
node test-sharepoint.js
```

It will show:
- ✅ What's working
- ❌ What needs fixing
- 💡 Troubleshooting tips

### Common Issues

**"ItemNotFound" Error:**
- CSV file doesn't exist or path is wrong
- Create a CSV file in SharePoint first
- Try different path formats

**"Access Denied" Error:**
- Azure AD permissions not granted
- Check if admin consent was given
- Verify Sites.ReadWrite.All permission

**"Authentication Failed" Error:**
- Client secret might be expired
- Double-check TENANT_ID, CLIENT_ID, CLIENT_SECRET
- Ensure there are no extra spaces in .env

## Need Help?

1. **Connection Issues**: Run `node test-sharepoint.js`
2. **Can't Find CSV Path**: See `FIND_CSV_PATH.md`
3. **Azure AD Setup**: See `AZURE_SETUP.md`
4. **General Help**: See `QUICKSTART.md`

## Next Steps

Once your `.env` is configured:

1. **Test locally**: `npm start`
2. **Try the UI**: Open http://localhost:3000
3. **Validate an order**: Enter an order number
4. **Book an appointment**: Select a time slot

See `TESTING.md` for complete testing guide.

## Production Deployment

When ready to deploy:
1. See `DEPLOYMENT.md` for Netlify + Railway instructions
2. Add these environment variables to Railway
3. Update frontend API URL to point to Railway
4. Deploy!

---

**Your credentials are ready!** Just copy `.env.sunique` to `.env` and find your CSV path. 🚀

