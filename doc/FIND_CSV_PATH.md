# Finding Your CSV File Path in SharePoint

Your SharePoint credentials are configured, but you need to find the exact path to your CSV file.

## Your SharePoint Site

Based on your credentials:
- **SharePoint Site**: https://suniquecabinetry.sharepoint.com/sites/sccr
- **Tenant ID**: 2697b6a6-c757-4a49-b571-b4f3297efb07
- **Client ID**: ffaf83f4-6c92-4035-a1e4-36bea3e9ed43

## Method 1: Find Path in SharePoint (Easiest)

1. Go to: https://suniquecabinetry.sharepoint.com/sites/sccr
2. Navigate to where your orders CSV file is stored
3. Find your CSV file (or create one if it doesn't exist)
4. Click the three dots (...) next to the file
5. Click **Details** in the menu
6. Look for the **Path** field - it will show something like:
   - `/Shared Documents/orders.csv`
   - `/Documents/orders.csv`
   - `/Lists/Orders/orders.csv`

## Method 2: Using Microsoft Graph Explorer

1. Go to [Microsoft Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
2. Sign in with your SharePoint account
3. Try this query to list document libraries:

```
GET https://graph.microsoft.com/v1.0/sites/suniquecabinetry.sharepoint.com:/sites/sccr:/drives
```

4. Find your drive ID, then list files:

```
GET https://graph.microsoft.com/v1.0/sites/suniquecabinetry.sharepoint.com:/sites/sccr:/drive/root/children
```

5. Look for your CSV file in the response

## Method 3: Test with This Script

Create a test script to find your file:

```javascript
// test-sharepoint.js
require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

async function testSharePointAccess() {
  try {
    const credential = new ClientSecretCredential(
      process.env.TENANT_ID,
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });

    const client = Client.initWithMiddleware({ authProvider });

    // Get site info
    console.log('Testing SharePoint access...\n');
    const site = await client.api('/sites/suniquecabinetry.sharepoint.com:/sites/sccr').get();
    console.log('✅ Site found:', site.displayName);
    console.log('Site ID:', site.id);

    // List drives
    console.log('\n📁 Document Libraries:');
    const drives = await client.api(`/sites/${site.id}/drives`).get();
    drives.value.forEach(drive => {
      console.log(`  - ${drive.name} (ID: ${drive.id})`);
    });

    // List files in default drive
    console.log('\n📄 Files in default document library:');
    const items = await client.api(`/sites/${site.id}/drive/root/children`).get();
    items.value.forEach(item => {
      if (item.file) {
        console.log(`  - ${item.name} (Path: ${item.parentReference.path}/root:/${item.name})`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSharePointAccess();
```

Run it:
```bash
npm install
node test-sharepoint.js
```

## Common CSV File Paths

Based on typical SharePoint setups:

1. **Shared Documents** (most common):
   ```
   /Shared Documents/orders.csv
   ```

2. **Documents folder**:
   ```
   /Documents/orders.csv
   ```

3. **In a subfolder**:
   ```
   /Shared Documents/data/orders.csv
   ```

4. **Root of site**:
   ```
   /orders.csv
   ```

## Create Your CSV File

If you don't have a CSV file yet, create one in SharePoint:

1. Go to: https://suniquecabinetry.sharepoint.com/sites/sccr
2. Navigate to "Shared Documents" (or create a folder)
3. Click **New** → **Blank file** or upload a file
4. Name it: `orders.csv`
5. Open and add these headers:

```csv
Order_Number,Status,Pickup_Time
```

6. Add some test data:

```csv
Order_Number,Status,Pickup_Time
1001,Ready to Pickup,
1002,In Progress,
1003,Ready to Pickup,
1004,Ready to Pickup,2025-11-13T14:30:00.000Z
```

7. Save the file
8. Get the path using Method 1 above

## Update Your .env File

Once you find the path, update `.env`:

```env
CSV_FILE_PATH=/Shared Documents/orders.csv
```

Or whatever the actual path is.

## Test Your Configuration

After updating `.env`, test it:

```bash
npm start
```

Then test the API:

```bash
curl http://localhost:3000/api/health
```

If successful, test order validation:

```bash
curl -X POST http://localhost:3000/api/validate-order \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "1001"}'
```

## Troubleshooting

### Error: "ItemNotFound"
- The CSV_FILE_PATH is incorrect
- Try different path formats (with/without leading slash)
- Verify file exists in SharePoint

### Error: "Access denied"
- Check Azure AD permissions (Sites.ReadWrite.All)
- Verify admin consent was granted
- Ensure service account has access to the site

### Error: "Invalid request"
- Check SHAREPOINT_SITE_URL format
- Verify hostname and site name are correct

## Need Help?

If you're still having trouble finding the path:
1. Take a screenshot of the file location in SharePoint
2. Share the URL when viewing the file
3. Check the browser's address bar - it often shows the path

The URL format is usually:
```
https://suniquecabinetry.sharepoint.com/sites/sccr/Shared%20Documents/orders.csv
```

The path would be: `/Shared Documents/orders.csv`

