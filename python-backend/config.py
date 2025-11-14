import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Server Configuration
    PORT = int(os.getenv('PORT', 3000))
    
    # Microsoft Graph API Configuration for SharePoint
    CLIENT_ID = os.getenv('CLIENT_ID')
    CLIENT_SECRET = os.getenv('CLIENT_SECRET')
    TENANT_ID = os.getenv('TENANT_ID')
    
    # SharePoint Configuration
    SHAREPOINT_SITE_URL = os.getenv('SHAREPOINT_SITE_URL')
    SHAREPOINT_SITE_ID = os.getenv('SHAREPOINT_SITE_ID') or os.getenv('SHAREPOINT_OBJECT_ID')
    ORDERS_FILE_PATH = os.getenv('ORDERS_FILE_PATH')
    APPOINTMENTS_FILE_PATH = os.getenv('APPOINTMENTS_FILE_PATH', '/Sunique Wiki/appointments.csv')
    
    # Microsoft Graph API Configuration for Email
    OUTLOOK_CLIENT_ID = os.getenv('OUTLOOK_CLIENT_ID')
    OUTLOOK_CLIENT_SECRET = os.getenv('OUTLOOK_CLIENT_SECRET')
    OUTLOOK_TENANT_ID = os.getenv('OUTLOOK_TENANT_ID')
    OUTLOOK_SENDER_EMAIL = os.getenv('OUTLOOK_SENDER_EMAIL', 'info@suniquecabinetry.com')
    
    # Admin Configuration
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '2045@Westgate')
    
    # Time Slot Configuration
    TIME_SLOT_START_HOUR = 9  # 9 AM
    TIME_SLOT_END_HOUR = 17   # 5 PM
    TIME_SLOT_INTERVAL_MINUTES = 30
    TIME_SLOT_DAYS_AHEAD = 8  # Number of days to show for booking
    
    # CORS Configuration
    CORS_ORIGINS = [
        'http://localhost:3000',
        'https://sunique-pickup-appointment.netlify.app',
        'https://sunique-order-pickup-appointment.onrender.com'
    ]

