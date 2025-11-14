# Deployment Checklist

Use this checklist to ensure your deployment is complete and working correctly.

## Pre-Deployment

### Azure Setup
- [ ] Azure App Registration created for SharePoint access
- [ ] Azure App Registration created for Outlook/Email access
- [ ] API permissions granted and admin consented
- [ ] Client secrets generated and saved securely
- [ ] SharePoint site ID obtained
- [ ] SharePoint file paths verified

### Repository Setup
- [ ] Code pushed to GitHub
- [ ] All sensitive data removed from code
- [ ] `.env` files not committed (in `.gitignore`)
- [ ] `netlify.toml` present in root
- [ ] `railway.json` configured for Python backend
- [ ] `python-backend/requirements.txt` up to date
- [ ] `python-backend/Procfile` present

## Railway Deployment (Backend)

### Initial Setup
- [ ] Railway account created
- [ ] New project created from GitHub repo
- [ ] Repository connected successfully

### Environment Variables Set
- [ ] `SECRET_KEY` - Random secure string
- [ ] `CLIENT_ID` - SharePoint app client ID
- [ ] `CLIENT_SECRET` - SharePoint app client secret
- [ ] `TENANT_ID` - Azure tenant ID
- [ ] `SHAREPOINT_SITE_URL` - Full SharePoint site URL
- [ ] `SHAREPOINT_SITE_ID` - SharePoint site object ID
- [ ] `ORDERS_FILE_PATH` - Path to orders Excel file
- [ ] `APPOINTMENTS_FILE_PATH` - Path to appointments CSV file
- [ ] `OUTLOOK_CLIENT_ID` - Email app client ID
- [ ] `OUTLOOK_CLIENT_SECRET` - Email app client secret
- [ ] `OUTLOOK_TENANT_ID` - Azure tenant ID
- [ ] `OUTLOOK_SENDER_EMAIL` - Sender email address
- [ ] `ADMIN_PASSWORD` - Admin portal password

### Deployment Verification
- [ ] Railway build completed successfully
- [ ] No errors in Railway logs
- [ ] Backend URL obtained (e.g., `https://xxx.up.railway.app`)
- [ ] Health check endpoint works: `https://xxx.up.railway.app/api/health`
- [ ] Can access available slots: `https://xxx.up.railway.app/api/available-slots`

## Netlify Deployment (Frontend)

### Initial Setup
- [ ] Netlify account created
- [ ] New site created from GitHub repo
- [ ] Build settings configured (publish directory: `public`)
- [ ] Initial deployment successful

### Configuration
- [ ] Update `netlify.toml` with Railway backend URL
- [ ] Commit and push `netlify.toml` changes
- [ ] Netlify site redeployed automatically
- [ ] Netlify site URL obtained (e.g., `https://xxx.netlify.app`)

### Custom Domain (Optional)
- [ ] Custom domain added in Netlify
- [ ] DNS records configured
- [ ] HTTPS certificate issued (automatic)
- [ ] Domain accessible

### CORS Update
- [ ] Railway environment variable updated with Netlify URL
- [ ] Or `python-backend/config.py` updated with Netlify URL
- [ ] Railway backend redeployed after CORS update

## Testing

### Customer Portal
- [ ] Frontend loads without errors
- [ ] Can enter order number
- [ ] Order validation works
- [ ] Available time slots display correctly
- [ ] Calendar navigation works
- [ ] Can select a time slot
- [ ] Email input validation works
- [ ] Can complete booking
- [ ] Confirmation screen displays
- [ ] Confirmation email received

### Admin Portal
- [ ] Admin page accessible at `/admin.html`
- [ ] Can login with admin password
- [ ] Appointments display in calendar view
- [ ] Appointments display in list view
- [ ] Search functionality works
- [ ] Filter by date works
- [ ] Can view appointment details
- [ ] Can cancel appointments
- [ ] Can reschedule appointments
- [ ] Can manually add appointments

### API Endpoints
- [ ] `/api/health` - Returns healthy status
- [ ] `/api/validate-order` - Validates order numbers
- [ ] `/api/available-slots` - Returns available time slots
- [ ] `/api/book-appointment` - Books appointments successfully
- [ ] `/api/admin/login` - Admin authentication works
- [ ] `/api/admin/appointments` - Returns all appointments
- [ ] `/api/admin/cancel-appointment` - Cancels appointments
- [ ] `/api/admin/reschedule-appointment` - Reschedules appointments

### SharePoint Integration
- [ ] Can read orders from SharePoint Excel file
- [ ] Can read appointments from SharePoint CSV file
- [ ] Can write appointments to SharePoint CSV file
- [ ] File locking works (no concurrent write issues)

### Email Service
- [ ] Confirmation emails sent successfully
- [ ] Emails have correct formatting
- [ ] Emails include all required information
- [ ] Cancellation emails sent successfully
- [ ] Reschedule emails sent successfully

## Error Handling

### Browser Console
- [ ] No JavaScript errors
- [ ] No CORS errors
- [ ] API calls complete successfully
- [ ] No 404 errors for resources

### Railway Logs
- [ ] No Python exceptions
- [ ] No authentication errors
- [ ] No SharePoint access errors
- [ ] No email sending errors

### Netlify Logs
- [ ] Deployment logs clean
- [ ] No build errors
- [ ] Redirects working correctly

## Security

- [ ] HTTPS enabled on frontend (automatic with Netlify)
- [ ] HTTPS enabled on backend (automatic with Railway)
- [ ] Admin password is strong
- [ ] No secrets in client-side code
- [ ] CORS properly configured
- [ ] Security headers set in `netlify.toml`

## Documentation

- [ ] Deployment URLs documented
- [ ] Admin credentials stored securely
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Maintenance procedures documented

## Post-Deployment

- [ ] Team notified of new URLs
- [ ] Customers informed of new booking system
- [ ] Old system deprecated (if applicable)
- [ ] Monitoring set up (Railway/Netlify dashboards)
- [ ] Backup procedures established

## Ongoing Maintenance

- [ ] Monitor Railway logs weekly
- [ ] Monitor Netlify logs weekly
- [ ] Check SharePoint file sizes monthly
- [ ] Update dependencies quarterly
- [ ] Rotate secrets annually
- [ ] Review and backup data monthly

## Troubleshooting Quick Reference

### Issue: CORS Error
**Solution**: Add Netlify URL to Railway CORS_ORIGINS environment variable

### Issue: 500 Error on API Calls
**Solution**: Check Railway logs for Python exceptions, verify SharePoint credentials

### Issue: Emails Not Sending
**Solution**: Verify Outlook credentials, check email service permissions in Azure

### Issue: Orders Not Found
**Solution**: Verify ORDERS_FILE_PATH, check SharePoint file permissions

### Issue: Appointments Not Saving
**Solution**: Verify APPOINTMENTS_FILE_PATH, check SharePoint write permissions

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Notes**: _________________________________________________________________

