const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

class EmailService {
  constructor() {
    this.clientId = process.env.OUTLOOK_CLIENT_ID;
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    this.tenantId = process.env.OUTLOOK_TENANT_ID;
    this.senderEmail = process.env.OUTLOOK_SENDER_EMAIL || 'westgatewarehouse@suniquecabinetry.com';
    
    if (!this.clientId || !this.clientSecret || !this.tenantId) {
      console.error('Outlook API credentials are not properly configured in .env file');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
      this.initializeClient();
    }
  }

  initializeClient() {
    try {
      const credential = new ClientSecretCredential(
        this.tenantId,
        this.clientId,
        this.clientSecret
      );

      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default']
      });

      this.graphClient = Client.initWithMiddleware({
        authProvider: authProvider
      });
    } catch (error) {
      console.error('Error initializing Microsoft Graph client:', error);
      this.isConfigured = false;
    }
  }

  async sendConfirmationEmail(appointmentDetails) {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const { orderNumber, pickupTime, customerEmail } = appointmentDetails;
      
      if (!customerEmail) {
        return { success: false, message: 'Customer email is required' };
      }
      
      const recipients = [{
        emailAddress: {
          address: customerEmail
        }
      }];
      
      const ccRecipients = [{
        emailAddress: {
          address: 'zackwu204@gmail.com'
        }
      }];

      const emailBody = this.generateEmailBody(orderNumber, pickupTime);
      
      const message = {
        message: {
          subject: `Appointment Confirmation - Order ${orderNumber}`,
          body: {
            contentType: 'HTML',
            content: emailBody
          },
          toRecipients: recipients,
          ccRecipients: ccRecipients
        },
        saveToSentItems: true
      };

      await this.graphClient
        .api(`/users/${this.senderEmail}/sendMail`)
        .post(message);

      console.log('Confirmation email sent successfully');
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { success: false, message: error.message };
    }
  }

  async sendCancellationEmail(appointmentDetails) {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const { orderNumber, appointmentDate, appointmentTime, customerEmail } = appointmentDetails;
      
      if (!customerEmail) {
        return { success: false, message: 'Customer email is required' };
      }
      
      const recipients = [{
        emailAddress: {
          address: customerEmail
        }
      }];
      
      const ccRecipients = [{
        emailAddress: {
          address: 'zackwu204@gmail.com'
        }
      }];

      const emailBody = this.generateCancellationEmailBody(orderNumber, appointmentDate, appointmentTime);
      
      const message = {
        message: {
          subject: `Appointment Cancelled - Order ${orderNumber}`,
          body: {
            contentType: 'HTML',
            content: emailBody
          },
          toRecipients: recipients,
          ccRecipients: ccRecipients
        },
        saveToSentItems: true
      };

      await this.graphClient
        .api(`/users/${this.senderEmail}/sendMail`)
        .post(message);

      console.log('Cancellation email sent successfully');
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending cancellation email:', error);
      return { success: false, message: error.message };
    }
  }

  async sendRescheduleEmail(appointmentDetails) {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const { orderNumber, oldAppointmentDate, oldAppointmentTime, newPickupTime, customerEmail } = appointmentDetails;
      
      if (!customerEmail) {
        return { success: false, message: 'Customer email is required' };
      }
      
      const recipients = [{
        emailAddress: {
          address: customerEmail
        }
      }];
      
      const ccRecipients = [{
        emailAddress: {
          address: 'zackwu204@gmail.com'
        }
      }];

      const emailBody = this.generateRescheduleEmailBody(orderNumber, oldAppointmentDate, oldAppointmentTime, newPickupTime);
      
      const message = {
        message: {
          subject: `Appointment Rescheduled - Order ${orderNumber}`,
          body: {
            contentType: 'HTML',
            content: emailBody
          },
          toRecipients: recipients,
          ccRecipients: ccRecipients
        },
        saveToSentItems: true
      };

      await this.graphClient
        .api(`/users/${this.senderEmail}/sendMail`)
        .post(message);

      console.log('Reschedule email sent successfully');
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Error sending reschedule email:', error);
      return { success: false, message: error.message };
    }
  }

  generateEmailBody(orderNumber, pickupTime) {
    const formattedDateTime = new Date(pickupTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Chicago'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #515a36 0%, #6b7444 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .details {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .details p {
            margin: 10px 0;
          }
          .details strong {
            color: #515a36;
          }
          .instructions {
            background: #fff8e1;
            padding: 20px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
          }
          .instructions h3 {
            margin-top: 0;
            color: #f59e0b;
          }
          .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          .instructions li {
            margin: 10px 0;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmation</h1>
            <p>Sunique Cabinetry Pickup Appointment</p>
          </div>
          <div class="content">
            <p>Your pickup appointment has been confirmed!</p>
            
            <div class="details">
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Pickup Time:</strong> ${formattedDateTime}</p>
            </div>
            
            <div class="instructions">
              <h3>Important Instructions</h3>
              <ol>
                <li>Please save this confirmation for your reference and prepare it when picking up.</li>
                <li>To cancel or modify your appointment, please contact Sunique at <strong>(972) 245-3309</strong>.</li>
                <li>The appointment is reserved for 10 minutes. If you are delayed more than 10 minutes, the appointment will be void.</li>
                <li>We reserve the right to adjust the time. We will do our best to get your order ready, but we do not guarantee it will be ready at the exact scheduled time.</li>
              </ol>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p><strong>Sunique Cabinetry</strong></p>
            <p>Phone: (972) 245-3309</p>
            <p>This is an automated confirmation email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateCancellationEmailBody(orderNumber, appointmentDate, appointmentTime) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .details {
            background: #fee2e2;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
          }
          .details p {
            margin: 10px 0;
          }
          .details strong {
            color: #dc2626;
          }
          .info {
            background: #fff8e1;
            padding: 20px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Cancelled</h1>
            <p>Sunique Cabinetry Pickup Appointment</p>
          </div>
          <div class="content">
            <p>Your pickup appointment has been cancelled.</p>
            
            <div class="details">
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Cancelled Appointment:</strong> ${appointmentDate} at ${appointmentTime}</p>
            </div>
            
            <div class="info">
              <p><strong>What to do next:</strong></p>
              <p>If you would like to reschedule your pickup appointment, please contact Sunique at <strong>(972) 245-3309</strong> or visit our scheduling system to book a new time slot.</p>
            </div>
            
            <p>We apologize for any inconvenience. If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p><strong>Sunique Cabinetry</strong></p>
            <p>Phone: (972) 245-3309</p>
            <p>This is an automated notification email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateRescheduleEmailBody(orderNumber, oldAppointmentDate, oldAppointmentTime, newPickupTime) {
    const formattedNewDateTime = new Date(newPickupTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Chicago'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .details {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
          }
          .details p {
            margin: 10px 0;
          }
          .details strong {
            color: #2563eb;
          }
          .old-time {
            background: #fee2e2;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            text-decoration: line-through;
            color: #6b7280;
          }
          .new-time {
            background: #dcfce7;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            color: #16a34a;
            font-weight: bold;
          }
          .instructions {
            background: #fff8e1;
            padding: 20px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
          }
          .instructions h3 {
            margin-top: 0;
            color: #f59e0b;
          }
          .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          .instructions li {
            margin: 10px 0;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Rescheduled</h1>
            <p>Sunique Cabinetry Pickup Appointment</p>
          </div>
          <div class="content">
            <p>Your pickup appointment has been rescheduled.</p>
            
            <div class="details">
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              
              <div class="old-time">
                <p><strong>Previous Time:</strong> ${oldAppointmentDate} at ${oldAppointmentTime}</p>
              </div>
              
              <div class="new-time">
                <p><strong>New Pickup Time:</strong> ${formattedNewDateTime}</p>
              </div>
            </div>
            
            <div class="instructions">
              <h3>Important Instructions</h3>
              <ol>
                <li>Please save this confirmation for your reference and prepare it when picking up.</li>
                <li>If this time does not work for you, please contact Sunique at <strong>(972) 245-3309</strong> to reschedule.</li>
                <li>The appointment is reserved for 10 minutes. If you are delayed more than 10 minutes, the appointment will be void.</li>
                <li>We reserve the right to adjust the time. We will do our best to get your order ready, but we do not guarantee it will be ready at the exact scheduled time.</li>
              </ol>
            </div>
            
            <p>We apologize for any inconvenience. If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p><strong>Sunique Cabinetry</strong></p>
            <p>Phone: (972) 245-3309</p>
            <p>This is an automated notification email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();

