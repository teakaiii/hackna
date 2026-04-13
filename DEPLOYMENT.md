# ConcernTracker PRO - Deployment Guide

## Deployment to InfinityFree

### Prerequisites
- InfinityFree account: https://dash.infinityfree.com/accounts/if0_41647799
- FTP credentials from InfinityFree
- MySQL database credentials from InfinityFree
- Gmail App Password for email notifications

### Step 1: Get InfinityFree Credentials

1. **Login to InfinityFree Dashboard**
   - URL: https://dash.infinityfree.com/accounts/if0_41647799
   - Login with your InfinityFree credentials

2. **Get MySQL Database Credentials**
   - Go to "MySQL Databases" in dashboard
   - Create a new database (or note existing one)
   - Note down:
     - Database name
     - Database username
     - Database password
     - Database host (usually: `sqlXXX.infinityfree.com`)

3. **Get FTP Credentials**
   - Go to "FTP Accounts" in dashboard
   - Note down:
     - FTP host (usually: `ftpupload.infinityfree.com`)
     - FTP username
     - FTP password
     - Port (usually: 21)

### Step 2: Prepare Application Files

1. **Upload files via FTP**
   - Use FileZilla or similar FTP client
   - Upload all files to `htdocs/` directory
   - **Do NOT upload**:
     - `node_modules/` (will be installed on server)
     - `.git/` (if present)
     - `concerntracker.db` (old SQLite file)

2. **Install dependencies on server**
   - Access SSH or use InfinityFree's file manager
   - Navigate to your `htdocs/` directory
   - Run: `npm install --production`

### Step 3: Configure Environment Variables

Create `.env` file in the root directory with:

```env
# Production Configuration
PORT=3000
NODE_ENV=production

# MySQL Database (InfinityFree)
DB_HOST=your_mysql_host.infinityfree.com
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name

# Gmail Email Service
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your_16_char_app_password
FROM_EMAIL=noreply@concerntrack.app

# Base URL
PUBLIC_URL=https://if0_41647799.infinityfreeapp.com
```

### Step 4: Start the Application

**Option A: Using SSH (Recommended)**
1. Access SSH via InfinityFree dashboard
2. Navigate to `htdocs/` directory
3. Run: `npm start`
4. Use a process manager like PM2 to keep it running:
   ```bash
   npm install -g pm2
   pm2 start server-enhanced.js --name concerntracker
   pm2 save
   pm2 startup
   ```

**Option B: Using InfinityFree's Node.js Support**
1. Check if InfinityFree supports Node.js in your plan
2. Configure startup script in dashboard
3. Set main file to: `server-enhanced.js`

### Step 5: Verify Deployment

1. **Test the application**
   - Visit: https://if0_41647799.infinityfreeapp.com
   - Test concern submission
   - Verify email notifications work

2. **Check server logs**
   - Access SSH or use InfinityFree's log viewer
   - Look for errors in application logs

### Troubleshooting

**Issue: Port already in use**
- Change PORT in `.env` to a different port (e.g., 8080)
- Update InfinityFree's port forwarding if needed

**Issue: MySQL connection failed**
- Verify MySQL credentials are correct
- Check if MySQL host is accessible
- Ensure database exists on InfinityFree

**Issue: Email not sending**
- Verify Gmail App Password is correct
- Check if EMAIL_USER is properly set
- Review server logs for email errors

**Issue: Application crashes**
- Check error logs
- Verify all dependencies are installed
- Ensure Node.js version is >= 14.0.0

### Alternative: Use InfinityFree's PHP Support

If Node.js is not supported, consider:
1. Deploy to a Node.js hosting service (Render, Heroku, Railway)
2. Use InfinityFree for static files only
3. Use external MySQL database service

### Post-Deployment Checklist

- [ ] Application is accessible via domain
- [ ] MySQL database connection working
- [ ] Email notifications functional
- [ ] Admin login working (admin@demo.com / admin123)
- [ ] Student concern submission working
- [ ] NLP analysis working
- [ ] Scheduled jobs running
- [ ] HTTPS/SSL configured (if available)

### Monitoring

- Regularly check server logs
- Monitor database size
- Track email delivery rates
- Review error logs for issues

### Backup Strategy

- Export MySQL database regularly
- Keep local copy of `.env` file
- Backup important configuration files
- Document any custom changes

### Support

For InfinityFree-specific issues:
- Check InfinityFree documentation
- Contact InfinityFree support
- Review community forums

For application issues:
- Check application logs
- Review this deployment guide
- Contact development team
