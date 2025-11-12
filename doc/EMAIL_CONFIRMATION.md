# Email Confirmation Feature

## Overview
The appointment system now sends confirmation emails after successful appointment booking using Microsoft Outlook API.

## Features

### User Experience
1. **Required Email Input**: After selecting a date and time slot, users must enter their email address
2. **Email Validation**: The system validates email format before allowing booking
3. **Confirmation Display**: After booking, the confirmation page shows the email address where confirmation was sent

### Email Recipients
- TO: Customer's email address
- CC: westgatewarehouse@suniquecabinetry.com, kevin.li@suniquecabinetry.com

### Email Content
The confirmation email includes:
- Order Number
- Pickup Date and Time (formatted in Central Time)
- Important pickup instructions
- Contact information for modifications/cancellations
- Professional HTML template with Sunique branding

## Configuration

### Required Environment Variables
Add these to your `.env` file:

```
OUTLOOK_CLIENT_ID=your-client-id
OUTLOOK_CLIENT_SECRET=your-client-secret
OUTLOOK_TENANT_ID=your-tenant-id
OUTLOOK_SENDER_EMAIL=westgatewarehouse@suniquecabinetry.com
```

### Microsoft Graph API Setup
1. Register an application in Azure AD
2. Grant the following API permissions:
   - `Mail.Send` (Application permission)
3. Create a client secret
4. Add the credentials to your `.env` file

## Technical Implementation

### Frontend Changes
- Added email input field in `public/index.html`
- Updated `public/app.js` to capture and validate email
- Added CSS styling in `public/styles.css`

### Backend Changes
- Created `server/emailService.js` for email functionality
- Updated `server/server.js` to integrate email sending
- Uses Microsoft Graph API with client credentials flow

### Dependencies
The following packages are used:
- `@azure/identity` - Azure authentication
- `@microsoft/microsoft-graph-client` - Microsoft Graph API client

## Error Handling
- If email service is not configured, the booking will still succeed
- Email failures are logged but don't prevent appointment booking
- Users are notified if email validation fails before booking

## Testing
To test the email feature:
1. Ensure all environment variables are configured
2. Book an appointment with a valid email address
3. Check inbox and spam folder for confirmation email
4. Verify CC recipients also receive the email

## Security
- Uses OAuth 2.0 client credentials flow
- Credentials stored securely in environment variables
- Email sending requires proper Azure AD app permissions

