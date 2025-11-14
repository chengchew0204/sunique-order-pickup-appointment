import msal
import requests
from datetime import datetime

class EmailService:
    def __init__(self, config):
        self.config = config
        self.client_id = config.get('OUTLOOK_CLIENT_ID')
        self.client_secret = config.get('OUTLOOK_CLIENT_SECRET')
        self.tenant_id = config.get('OUTLOOK_TENANT_ID')
        self.sender_email = config.get('OUTLOOK_SENDER_EMAIL', 'info@suniquecabinetry.com')
        
        if not self.client_id or not self.client_secret or not self.tenant_id:
            print('Outlook API credentials are not properly configured')
            self.is_configured = False
        else:
            self.is_configured = True
            self.authority = f"https://login.microsoftonline.com/{self.tenant_id}"
            self.scope = ['https://graph.microsoft.com/.default']
            
            self.app = msal.ConfidentialClientApplication(
                self.client_id,
                authority=self.authority,
                client_credential=self.client_secret
            )
    
    def get_access_token(self):
        """Get Microsoft Graph API access token"""
        result = self.app.acquire_token_silent(self.scope, account=None)
        
        if not result:
            result = self.app.acquire_token_for_client(scopes=self.scope)
        
        if "access_token" in result:
            return result['access_token']
        else:
            raise Exception(f"Failed to acquire token: {result.get('error_description', 'Unknown error')}")
    
    def send_confirmation_email(self, order_number, pickup_time, customer_email):
        """Send appointment confirmation email"""
        if not self.is_configured:
            print('Email service not configured. Skipping email send.')
            return {'success': False, 'message': 'Email service not configured'}
        
        try:
            if not customer_email:
                return {'success': False, 'message': 'Customer email is required'}
            
            # Generate email body
            email_body = self.generate_email_body(order_number, pickup_time)
            
            # Prepare email message
            message = {
                'message': {
                    'subject': f'Appointment Confirmation - Order {order_number}',
                    'body': {
                        'contentType': 'HTML',
                        'content': email_body
                    },
                    'toRecipients': [
                        {
                            'emailAddress': {
                                'address': customer_email
                            }
                        }
                    ],
                    'ccRecipients': [
                        {
                            'emailAddress': {
                                'address': 'zackwu204@gmail.com'
                            }
                        }
                    ]
                },
                'saveToSentItems': True
            }
            
            # Send email via Microsoft Graph API
            token = self.get_access_token()
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            url = f'https://graph.microsoft.com/v1.0/users/{self.sender_email}/sendMail'
            response = requests.post(url, headers=headers, json=message)
            
            if response.status_code == 202:
                print(f'Confirmation email sent successfully to {customer_email}')
                return {
                    'success': True,
                    'message': 'Email sent successfully'
                }
            else:
                print(f'Failed to send email: {response.status_code} - {response.text}')
                return {
                    'success': False,
                    'message': f'Failed to send email: {response.status_code}'
                }
                
        except Exception as e:
            print(f'Error sending email: {e}')
            return {
                'success': False,
                'message': f'Error sending email: {str(e)}'
            }
    
    def generate_email_body(self, order_number, pickup_time):
        """Generate HTML email body"""
        try:
            # Parse pickup time
            pickup_date = datetime.fromisoformat(pickup_time.replace('Z', '+00:00'))
            formatted_date = pickup_date.strftime('%B %d, %Y')
            formatted_time = pickup_date.strftime('%I:%M %p')
            
        except:
            formatted_date = 'N/A'
            formatted_time = 'N/A'
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #8B4513;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }}
                .content {{
                    background-color: #f9f9f9;
                    padding: 30px;
                    border-radius: 5px;
                    margin-top: 20px;
                }}
                .appointment-details {{
                    background-color: white;
                    padding: 20px;
                    border-left: 4px solid #8B4513;
                    margin: 20px 0;
                }}
                .detail-row {{
                    margin: 10px 0;
                }}
                .label {{
                    font-weight: bold;
                    color: #8B4513;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 14px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Appointment Confirmed</h1>
                </div>
                
                <div class="content">
                    <p>Dear Valued Customer,</p>
                    
                    <p>Your pickup appointment has been successfully scheduled.</p>
                    
                    <div class="appointment-details">
                        <div class="detail-row">
                            <span class="label">Order Number:</span> {order_number}
                        </div>
                        <div class="detail-row">
                            <span class="label">Pickup Date:</span> {formatted_date}
                        </div>
                        <div class="detail-row">
                            <span class="label">Pickup Time:</span> {formatted_time}
                        </div>
                        <div class="detail-row">
                            <span class="label">Location:</span> Westgate Warehouse<br>
                            2045 Westgate Dr, San Jose, CA 95125
                        </div>
                    </div>
                    
                    <p><strong>Important Information:</strong></p>
                    <ul>
                        <li>Please arrive within your scheduled time slot</li>
                        <li>Bring your order number for reference</li>
                        <li>Contact us if you need to reschedule</li>
                    </ul>
                    
                    <div class="footer">
                        <p>If you have any questions, please contact us:</p>
                        <p>
                            <strong>Sunique Cabinetry</strong><br>
                            Phone: (408) 295-8838<br>
                            Email: info@suniquecabinetry.com<br>
                            Address: 2045 Westgate Dr, San Jose, CA 95125
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

