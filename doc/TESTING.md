# Testing Guide

This guide provides instructions for testing the Appointment Scheduling System.

## Local Testing Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `CLIENT_ID`: Azure AD application client ID
- `CLIENT_SECRET`: Azure AD client secret
- `TENANT_ID`: Azure AD tenant ID
- `SHAREPOINT_SITE_URL`: Full SharePoint site URL
- `CSV_FILE_PATH`: Path to CSV file in SharePoint
- `PORT`: Server port (default: 3000)

### 3. Start the Server

```bash
npm start
```

Server will start on `http://localhost:3000`

## Test Scenarios

### Scenario 1: Order Validation - Valid Order

**Test Case**: Order exists and is ready for pickup

1. Navigate to `http://localhost:3000`
2. Enter order number: `1001` (or any order with "Ready to Pickup" status)
3. Click "Validate Order"

**Expected Result**:
- Green success message appears
- System transitions to time slot selection
- Order information is displayed

### Scenario 2: Order Validation - Order Not Found

**Test Case**: Order doesn't exist in CSV

1. Enter order number: `9999` (non-existent order)
2. Click "Validate Order"

**Expected Result**:
- Red error message: "Order not found"
- Stay on validation screen

### Scenario 3: Order Validation - Not Ready for Pickup

**Test Case**: Order exists but not ready

1. Enter order number: `1002` (order with "In Progress" status)
2. Click "Validate Order"

**Expected Result**:
- Red error message: "Order is not ready for pickup. Current status: In Progress"
- Stay on validation screen

### Scenario 4: Order Already Has Appointment

**Test Case**: Order already scheduled

1. Enter order number: `1004` (order with existing Pickup_Time)
2. Click "Validate Order"

**Expected Result**:
- Blue info message showing existing appointment time
- Stay on validation screen
- No ability to proceed to booking

### Scenario 5: Time Slot Selection

**Test Case**: Viewing available slots

1. Complete successful order validation
2. Observe time slot grid

**Expected Result**:
- Slots grouped by date
- Only weekdays shown (no weekends)
- Only 9:00 AM - 5:00 PM slots
- 30-minute intervals
- Only future times shown
- Already booked slots not displayed

### Scenario 6: Successful Booking

**Test Case**: Complete booking flow

1. Validate order: `1001`
2. Select an available time slot
3. Click "Confirm Booking"

**Expected Result**:
- Blue info message shows selected time
- "Confirm Booking" button appears
- After confirmation:
  - Loading state on button
  - Redirect to confirmation screen
  - Confirmation details displayed
  - CSV file updated with Pickup_Time

### Scenario 7: Race Condition Prevention

**Test Case**: Two users booking same slot

1. Open two browser windows
2. In both windows, validate different orders (`1001` and `1003`)
3. In both windows, select the same time slot
4. Click "Confirm Booking" in first window
5. Click "Confirm Booking" in second window (quickly)

**Expected Result**:
- First booking succeeds
- Second booking receives error: "This time slot is no longer available"

### Scenario 8: Empty Order Number

**Test Case**: Submit without order number

1. Leave order number field empty
2. Click "Validate Order"

**Expected Result**:
- Error message: "Please enter an order number"

### Scenario 9: Navigation - Back Button

**Test Case**: Return to validation screen

1. Complete order validation
2. Click "Back" button on time slot screen

**Expected Result**:
- Return to validation screen
- Order number field cleared
- No error messages shown

### Scenario 10: Navigation - New Appointment

**Test Case**: Start new appointment after confirmation

1. Complete full booking flow
2. Click "Schedule Another Appointment"

**Expected Result**:
- Return to validation screen
- All state cleared
- Ready for new order

## API Testing

### Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected Response**:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### Validate Order - Success

```bash
curl -X POST http://localhost:3000/api/validate-order \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "1001"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Order validated and ready for scheduling",
  "order": {
    "orderNumber": "1001",
    "status": "Ready to Pickup",
    "hasAppointment": false
  }
}
```

### Validate Order - Not Found

```bash
curl -X POST http://localhost:3000/api/validate-order \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "9999"}'
```

**Expected Response** (404):
```json
{
  "success": false,
  "message": "Order not found"
}
```

### Get Available Slots

```bash
curl http://localhost:3000/api/available-slots
```

**Expected Response**:
```json
{
  "success": true,
  "slots": [
    "2025-11-12T09:00:00.000Z",
    "2025-11-12T09:30:00.000Z",
    ...
  ],
  "totalSlots": 280,
  "availableCount": 275,
  "bookedCount": 5
}
```

### Book Appointment - Success

```bash
curl -X POST http://localhost:3000/api/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "1001",
    "slotTime": "2025-11-13T14:30:00.000Z"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "appointment": {
    "orderNumber": "1001",
    "pickupTime": "2025-11-13T14:30:00.000Z"
  }
}
```

### Book Appointment - Slot Taken

```bash
curl -X POST http://localhost:3000/api/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "1003",
    "slotTime": "2025-11-12T14:30:00.000Z"
  }'
```

**Expected Response** (409):
```json
{
  "success": false,
  "message": "This time slot is no longer available"
}
```

## CSV Verification

After booking, verify the CSV file was updated:

1. Go to SharePoint and open your CSV file
2. Find the order row
3. Verify `Pickup_Time` column has the ISO 8601 timestamp

Example:
```csv
Order_Number,Status,Pickup_Time
1001,Ready to Pickup,2025-11-13T14:30:00.000Z
```

## Browser Compatibility Testing

Test in multiple browsers:

- Google Chrome (latest)
- Mozilla Firefox (latest)
- Safari (latest)
- Microsoft Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

## Responsive Design Testing

Test at different screen sizes:

- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x667 (iPhone)
- Mobile: 360x640 (Android)

## Performance Testing

### Load Time
- Initial page load should be < 2 seconds
- Time slot loading should be < 3 seconds
- Booking submission should complete < 2 seconds

### Concurrent Users
- Test with 5-10 simultaneous users
- Verify lock mechanism prevents double-booking
- Check server response times remain reasonable

## Error Handling Testing

### Network Errors

1. Disconnect network
2. Try to validate order
3. Verify error message is shown

### Server Errors

1. Stop the backend server
2. Try to validate order
3. Verify appropriate error message

### Invalid Data

Test with various invalid inputs:
- Very long order numbers
- Special characters in order number
- SQL injection attempts
- XSS attempts

## Security Testing

### Input Validation
- Order number accepts only alphanumeric
- Time slots are validated server-side
- API endpoints reject invalid data

### CORS
- API should reject requests from unauthorized origins (in production)

### Authentication
- Verify Azure AD credentials are not exposed
- Check network tab for sensitive data in responses

## Automated Testing Setup

### Unit Tests (Future Enhancement)

Create test files for:
- CSV parsing functions
- Time slot generation
- Date formatting utilities

### Integration Tests (Future Enhancement)

Test scenarios:
- Full booking flow
- Error handling paths
- API endpoint responses

## Test Data

Sample test orders in `sample-orders.csv`:

| Order Number | Status | Expected Behavior |
|-------------|--------|-------------------|
| 1001 | Ready to Pickup | Can book |
| 1002 | In Progress | Cannot book |
| 1003 | Ready to Pickup | Can book |
| 1004 | Ready to Pickup | Already has appointment |
| 1005 | Pending | Cannot book |
| 1006 | Ready to Pickup | Can book |

## Troubleshooting Tests

If tests fail, check:

1. **Backend not starting**
   - Verify all dependencies installed
   - Check .env file exists and has correct values
   - Review server logs for errors

2. **Authentication errors**
   - Verify Azure AD credentials
   - Check API permissions granted
   - Ensure admin consent was given

3. **CSV not updating**
   - Verify SharePoint file permissions
   - Check file path is correct
   - Ensure service account has write access

4. **Time slots not loading**
   - Check server logs for errors
   - Verify CSV parsing is successful
   - Check date/time functions

## Reporting Issues

When reporting issues, include:
- Browser and version
- Error messages (from console)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Server logs (if backend issue)

