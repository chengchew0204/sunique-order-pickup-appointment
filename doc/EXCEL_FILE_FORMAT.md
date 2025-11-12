# Excel File Format for Sunique Order Ready List

## Required Columns

Your Excel file "Order Ready List.xlsx" should have these columns:

| Column Name | Description | Example |
|-------------|-------------|---------|
| **Ready Order Number** | Order number when ready for pickup | 1001 |
| **Pick up Status** | Current pickup status | Ready, Appointment Scheduled |
| **Ready Date** | Date when order became ready | 2025-11-10 |
| **Storage Fee Start From** | When storage fees begin | 2025-11-15 |
| **Pickup_Time** | Scheduled appointment time (auto-filled) | 2025-11-13T14:30:00.000Z |

## How It Works

### Order Validation Logic

**IF order number IS in "Ready Order Number" column:**
- ✅ Order is ready for pickup
- Customer can schedule an appointment

**IF order number is NOT in "Ready Order Number" column:**
- ❌ Order is not ready yet
- Customer sees: "Order not found or not ready for pickup yet"

### Booking Process

When a customer books an appointment:

1. System finds their order in "Ready Order Number" column
2. Adds the appointment time to "Pickup_Time" column
3. Updates "Pick up Status" to "Appointment Scheduled"
4. Saves changes to Excel file

## Example Excel Structure

```
| Ready Order Number | Pick up Status | Ready Date | Storage Fee Start From | Pickup_Time |
|--------------------|----------------|------------|------------------------|-------------|
| 1001               | Ready          | 11/10/2025 | 11/15/2025             |             |
| 1003               | Ready          | 11/11/2025 | 11/16/2025             |             |
| 1004               | Appointment    | 11/09/2025 | 11/14/2025             | 2025-11-13T14:30:00.000Z |
|                    |                |            |                        |             |
| 1007               | Ready          | 11/12/2025 | 11/17/2025             |             |
```

**Note:** Row 4 is empty in "Ready Order Number" column, so order is not ready yet.

## Current File Location

- **Site**: SuniqueKnowledgeBase
- **Path**: `/Sunique Wiki/Sales/Order Ready List.xlsx`
- **URL**: https://suniquecabinetry.sharepoint.com/sites/SuniqueKnowledgeBase

## Column Requirements

### "Ready Order Number" (REQUIRED)
- **Type**: Text or Number
- **Required**: YES - If empty, order is not ready
- **Example**: 1001, 2045, S-1234

### "Pick up Status" (OPTIONAL)
- **Type**: Text
- **Auto-updated**: Changed to "Appointment Scheduled" when booked
- **Example**: Ready, Appointment Scheduled, Picked Up

### "Ready Date" (OPTIONAL)
- **Type**: Date
- **Purpose**: Information only
- **Example**: 11/10/2025

### "Storage Fee Start From" (OPTIONAL)
- **Type**: Date
- **Purpose**: Information only
- **Example**: 11/15/2025

### "Pickup_Time" (AUTO-CREATED)
- **Type**: DateTime (ISO 8601 format)
- **Created by**: System automatically adds this column
- **Example**: 2025-11-13T14:30:00.000Z
- **Note**: Customers will see formatted time like "Wednesday, November 13, 2025 at 2:30 PM"

## Tips

1. **Keep "Ready Order Number" column updated**
   - Only add order numbers when truly ready
   - Remove or clear number when order is picked up

2. **Don't manually edit "Pickup_Time"**
   - System manages this automatically
   - Uses ISO 8601 format for consistency

3. **File stays in SharePoint**
   - No need to download/upload
   - System reads and updates directly

4. **Multiple sheets supported**
   - System reads first sheet only
   - Other sheets are ignored

## Testing Your Setup

1. Add some test orders to "Ready Order Number" column
2. Run: `npm start`
3. Visit: http://localhost:3000
4. Try booking with one of your order numbers
5. Check Excel file - should see "Pickup_Time" added

## Customer Experience

1. **Customer enters order number**: "1001"
2. **System checks**: Is "1001" in "Ready Order Number" column?
   - YES → "Order validated! Please select a pickup time"
   - NO → "Order not found or not ready yet"
3. **Customer selects time slot**: "Wednesday 2:30 PM"
4. **System updates Excel**:
   - Adds time to "Pickup_Time": `2025-11-13T14:30:00.000Z`
   - Updates "Pick up Status": `Appointment Scheduled`
5. **Customer sees confirmation**: "Appointment confirmed for Wednesday, November 13, 2025 at 2:30 PM"

