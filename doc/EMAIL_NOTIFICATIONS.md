# Email Notifications for Admin Actions

## Overview
When staff reschedule or cancel appointments through the admin portal, the system now automatically sends email notifications to both customers and warehouse staff.

## What Was Implemented

### 1. Updated Data Structure
- Added `Customer_Email` column to the appointments file
- Customer email is now stored when booking an appointment
- Updated `csvHandler.js` to include the new column in all operations

### 2. New Email Templates

#### Cancellation Email
- **Subject**: "Appointment Cancelled - Order [OrderNumber]"
- **Recipients**: Customer (To) + Warehouse Staff (CC: zackwu204@gmail.com)
- **Content**: 
  - Order number
  - Cancelled appointment date and time
  - Instructions on how to reschedule
  - Contact information

#### Reschedule Email
- **Subject**: "Appointment Rescheduled - Order [OrderNumber]"
- **Recipients**: Customer (To) + Warehouse Staff (CC: zackwu204@gmail.com)
- **Content**:
  - Order number
  - Old appointment time (struck through)
  - New appointment time (highlighted)
  - Important instructions
  - Contact information

### 3. Email Service Methods
Added two new methods to `emailService.js`:
- `sendCancellationEmail(appointmentDetails)` - Sends cancellation notification
- `sendRescheduleEmail(appointmentDetails)` - Sends reschedule notification

### 4. Updated API Endpoints

#### Cancel Appointment Endpoint
`DELETE /api/admin/appointments/:orderNumber`
- Now retrieves customer email before deletion
- Sends cancellation email to customer and warehouse staff
- Gracefully handles missing email addresses

#### Reschedule Appointment Endpoint
`PUT /api/admin/appointments/:orderNumber`
- Now preserves customer email during reschedule
- Sends reschedule email with old and new times
- Includes warehouse staff in CC

## Email Design
All notification emails feature:
- Professional HTML design with responsive layout
- Color-coded headers (Red for cancellation, Blue for reschedule)
- Clear separation of information sections
- Company branding and contact information
- Timezone-aware date formatting (America/Chicago)

## Important Notes
1. **Email Configuration Required**: The email service requires Outlook API credentials to be properly configured in `.env`
2. **Graceful Degradation**: If email fails to send, the appointment operation still completes successfully
3. **Warehouse Staff CC**: All notification emails automatically CC zackwu204@gmail.com
4. **Backward Compatibility**: Existing appointments without email addresses will log a warning but won't fail

## Testing
To test the email notifications:
1. Book a new appointment (must provide customer email)
2. Login to admin portal at `/admin`
3. Cancel or reschedule the appointment
4. Check customer inbox and warehouse staff inbox for notification emails

## Future Enhancements
- Add ability to customize warehouse staff CC email addresses
- Support multiple CC recipients
- Add email delivery status tracking
- Create email notification logs

