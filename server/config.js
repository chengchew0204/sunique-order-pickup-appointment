require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  
  // Microsoft Graph API Configuration
  msalConfig: {
    auth: {
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      tenantId: process.env.TENANT_ID,
    }
  },
  
  // SharePoint Configuration
  sharepoint: {
    siteUrl: process.env.SHAREPOINT_SITE_URL,
    siteId: process.env.SHAREPOINT_SITE_ID || process.env.SHAREPOINT_OBJECT_ID, // Direct site ID (faster, bypasses lookup)
    ordersFilePath: process.env.ORDERS_FILE_PATH || process.env.CSV_FILE_PATH, // Read orders from this file
    appointmentsFilePath: process.env.APPOINTMENTS_FILE_PATH || '/Sunique Wiki/appointments.csv', // Write appointments to this file
  },
  
  // Time Slot Configuration
  timeSlots: {
    startHour: 9, // 9 AM
    endHour: 17, // 5 PM
    intervalMinutes: 30,
    daysAhead: 8, // Number of days to show for booking (one week)
  },
  
  // CORS Configuration
  corsOptions: {
    origin: [
      'http://localhost:3000',
      'https://sunique-pickup-appointment.netlify.app',
      'https://sunique-order-pickup-appointment.onrender.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Admin Authentication
  adminPassword: process.env.ADMIN_PASSWORD || '2045@Westgate'
};

