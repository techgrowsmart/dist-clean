# Deployment Instructions for gogrowsmart.com

## Overview
This guide explains how to deploy the updated Gogrowsmart application to the file manager public_html with the new routing configuration from `app.gogrowsmart.com` to `gogrowsmart.com`.

## Changes Made
- ✅ Updated CORS origins from `app.gogrowsmart.com` to `gogrowsmart.com` in:
  - `cors-proxy-server.js`
  - `backend-enhanced-signup.js`
  - `fix-cors-ssl.sh`
  - `fix-signup-validation.sh`
- ✅ Created `.htaccess` with SSL configuration for `gogrowsmart.com`
- ✅ Built production dist files with updated configuration

## Deployment Steps

### 1. Access File Manager
1. Login to your Hostinger control panel
2. Navigate to **File Manager**
3. Go to the `public_html` directory

### 2. Backup Current Files (Optional but Recommended)
```bash
# Create a backup of current public_html
mv public_html public_html-backup-$(date +%Y%m%d)
mkdir public_html
```

### 3. Upload Dist Files
**Option A: Upload via FTP/SFTP**
- Connect to your server using FileZilla or similar FTP client
- Upload the entire contents of the `dist` folder to `public_html`
- Ensure `.htaccess` is included

**Option B: Upload via File Manager**
- In Hostinger File Manager, navigate to `public_html`
- Delete all existing files (after backup)
- Upload all files from the `dist` folder
- Ensure the `.htaccess` file is uploaded

**Option C: Using SSH (if available)**
```bash
# Navigate to your server
cd /home/yourusername/public_html
# Remove old files
rm -rf *
# Upload new files (from your local machine)
# Then extract or copy dist contents
```

### 4. Verify .htaccess Configuration
The `.htaccess` file should be in the root of `public_html` and contain:

```apache
# Force HTTPS redirect
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Enable rewrite engine
RewriteEngine On

# Handle React Router/Expo Router SPA routing
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Enhanced CORS Headers for API routes
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "https://gogrowsmart.com, https://portal.gogrowsmart.com, https://growsmartserver.gogrowsmart.com"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    Header always set Access-Control-Allow-Credentials "true"
    Header always set Access-Control-Max-Age "86400"
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    
    # HSTS (HTTP Strict Transport Security)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>
```

### 5. SSL Certificate Setup
1. In Hostinger control panel, go to **SSL**
2. Enable **Let's Encrypt** (free SSL certificate) for `gogrowsmart.com`
3. Wait for SSL to be issued (usually 1-5 minutes)
4. Verify SSL is active by visiting `https://gogrowsmart.com`

### 6. Verify Deployment
1. Visit `https://gogrowsmart.com`
2. Check that the site loads correctly
3. Test navigation between different routes
4. Verify that all buttons navigate to `gogrowsmart.com` instead of `app.gogrowsmart.com`
5. Check browser console for any CORS errors
6. Test API calls to ensure they work with the new CORS configuration

### 7. Test Key Functionality
- ✅ User registration and login
- ✅ Teacher and student dashboards
- ✅ Navigation between pages
- ✅ API requests to backend
- ✅ SSL redirect (HTTP → HTTPS)
- ✅ SPA routing (direct URL access)

## Troubleshooting

### SSL Not Working
- Wait 5-10 minutes for SSL propagation
- Clear browser cache and try again
- Check SSL certificate status in Hostinger panel
- Ensure `.htaccess` has the HTTPS redirect rule

### CORS Errors
- Verify `.htaccess` CORS headers include `https://gogrowsmart.com`
- Check backend CORS configuration (already updated in backend files)
- Clear browser cache
- Test in incognito/private browsing mode

### SPA Routing Issues
- Ensure `.htaccess` rewrite rules are present
- Verify `mod_rewrite` is enabled on server
- Check file permissions (should be 644 for files, 755 for directories)

### Mixed Content Errors
- Ensure all resources are loaded via HTTPS
- Check for any hardcoded HTTP URLs in the codebase
- Verify CDN links use HTTPS

## File Permissions
Set correct permissions after upload:
```bash
# Files: 644
find public_html -type f -exec chmod 644 {} \;

# Directories: 755
find public_html -type d -exec chmod 755 {} \;

# .htaccess: 644
chmod 644 public_html/.htaccess
```

## Post-Deployment Checklist
- [ ] Site loads at `https://gogrowsmart.com`
- [ ] SSL certificate is valid
- [ ] HTTP redirects to HTTPS
- [ ] All navigation buttons work
- [ ] No CORS errors in browser console
- [ ] API calls are successful
- [ ] User authentication works
- [ ] Teacher/student dashboards accessible
- [ ] Mobile responsive design works

## Rollback Plan
If issues occur after deployment:
```bash
# Restore from backup
rm -rf public_html/*
mv public_html-backup-YYYYMMDD/* public_html/
```

## Support
For issues related to:
- **Hosting/SSL**: Contact Hostinger support
- **Application bugs**: Check application logs in browser console
- **Backend API**: Verify backend server is running and accessible

## Summary
The application has been successfully updated to route to `gogrowsmart.com` with proper SSL configuration. All CORS configurations have been updated to accept requests from the new domain. Follow the steps above to deploy to your file manager public_html.
