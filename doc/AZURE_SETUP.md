# Azure AD Setup Guide

This guide walks you through setting up Azure AD app registration for Microsoft Graph API access to SharePoint.

## Prerequisites

- Azure account with access to Azure Active Directory
- Admin permissions to grant consent for API permissions
- Access to the SharePoint site where your CSV file is stored

## Step 1: Create Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory**
3. Click **App registrations** in the left menu
4. Click **New registration**

### Registration Details

- **Name**: `Appointment System API`
- **Supported account types**: Select "Accounts in this organizational directory only (Single tenant)"
- **Redirect URI**: Leave blank (not needed for service-to-service authentication)

Click **Register**

## Step 2: Note Your Application Details

After registration, you'll see the app overview page. Copy these values:

- **Application (client) ID**: This is your `CLIENT_ID`
- **Directory (tenant) ID**: This is your `TENANT_ID`

You'll need these for your `.env` file.

## Step 3: Create Client Secret

1. In your app's page, click **Certificates & secrets** in the left menu
2. Click **New client secret**
3. Add a description: `Appointment System Secret`
4. Choose expiration: Recommended 24 months (you'll need to rotate it before expiration)
5. Click **Add**

**Important**: Copy the secret **Value** immediately - it won't be shown again. This is your `CLIENT_SECRET`.

## Step 4: Add API Permissions

1. Click **API permissions** in the left menu
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (not Delegated)
5. Search for and select these permissions:
   - `Sites.ReadWrite.All` - Read and write items in all site collections

6. Click **Add permissions**

## Step 5: Grant Admin Consent

**Critical Step**: Application permissions require admin consent.

1. In the API permissions page, click **Grant admin consent for [Your Organization]**
2. Click **Yes** to confirm
3. Wait for the status to show green checkmarks

Without admin consent, your app won't be able to access SharePoint.

## Step 6: Get SharePoint Site Information

### Find Your Site URL

Your SharePoint site URL should look like:
```
https://yourtenant.sharepoint.com/sites/yoursite
```

Example:
```
https://contoso.sharepoint.com/sites/operations
```

### Find Your CSV File Path

The file path should be relative to the site's document library.

Examples:
```
/Shared Documents/orders.csv
/Documents/data/orders.csv
/orders.csv
```

To find the exact path:
1. Navigate to your file in SharePoint
2. Click the three dots (...) next to the file
3. Click **Details**
4. The path will be shown in the details panel

## Step 7: Test Access Using Graph Explorer

Before using in your app, test the connection:

1. Go to [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
2. Sign in with your Azure AD account
3. Try this request:

```
GET https://graph.microsoft.com/v1.0/sites/root/sites/{sitename}
```

Replace `{sitename}` with your site name.

4. To access the file:

```
GET https://graph.microsoft.com/v1.0/sites/root/sites/{sitename}/drive/root:/path/to/orders.csv:/content
```

If you get permission errors, review Steps 4 and 5.

## Step 8: Configure Your Application

Create a `.env` file in your project root (copy from `.env.example`):

```env
CLIENT_ID=<your-application-client-id>
CLIENT_SECRET=<your-client-secret-value>
TENANT_ID=<your-directory-tenant-id>
SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/yoursite
CSV_FILE_PATH=/Shared Documents/orders.csv
PORT=3000
```

## Security Best Practices

### 1. Client Secret Management

- Store secrets in environment variables, never in code
- Use different secrets for development and production
- Set calendar reminders to rotate secrets before expiration
- Use Azure Key Vault for production environments

### 2. Least Privilege Principle

- Only grant the minimum permissions needed
- `Sites.ReadWrite.All` gives access to all sites - consider using more specific permissions if available
- Regularly audit app permissions

### 3. Monitor Usage

- Check Azure AD sign-in logs regularly
- Monitor for unusual API usage patterns
- Set up alerts for failed authentication attempts

### 4. Application Lifecycle

- Document the app registration details
- Maintain a list of where credentials are used
- Have a plan for rotating secrets
- Keep track of expiration dates

## Common Issues and Solutions

### Issue: "Insufficient privileges to complete the operation"

**Solution**: 
- Verify admin consent was granted (Step 5)
- Check that you selected **Application permissions** not Delegated permissions
- Wait a few minutes after granting consent for changes to propagate

### Issue: "Access token validation failure"

**Solution**:
- Verify CLIENT_ID, CLIENT_SECRET, and TENANT_ID are correct
- Ensure client secret hasn't expired
- Check that you copied the secret **Value** not the **Secret ID**

### Issue: "ItemNotFound" when accessing CSV

**Solution**:
- Verify the file exists at the specified path
- Check the CSV_FILE_PATH format (should start with `/`)
- Ensure the site URL is correct
- Verify the service account has access to the file

### Issue: "The tenant for tenant guid does not exist"

**Solution**:
- Verify TENANT_ID is correct
- Ensure you're using the Directory (tenant) ID, not the Application ID
- Check there are no extra spaces in the .env file

## Testing Your Setup

After configuration, test your setup:

1. Start your server locally:
   ```bash
   npm install
   npm start
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. Test order validation with a known order number:
   ```bash
   curl -X POST http://localhost:3000/api/validate-order \
     -H "Content-Type: application/json" \
     -d '{"orderNumber": "1001"}'
   ```

4. If you get errors, check the server logs for detailed error messages

## Resources

- [Microsoft Graph API Documentation](https://docs.microsoft.com/graph)
- [Azure AD App Registration Guide](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph Permissions Reference](https://docs.microsoft.com/graph/permissions-reference)
- [SharePoint Sites API](https://docs.microsoft.com/graph/api/resources/sharepoint)

## Support

If you need help:
- Microsoft Graph support: https://docs.microsoft.com/graph/overview
- Azure AD documentation: https://docs.microsoft.com/azure/active-directory/
- Stack Overflow: Tag your questions with `microsoft-graph` and `azure-active-directory`

