#!/bin/bash

echo "🔑 GOOGLE PLAY CONSOLE - ORIGINAL KEYSTORE RECOVERY"
echo "===================================================="
echo ""

echo "✅ You have the deployment certificate, but we need the ORIGINAL keystore"
echo ""

echo "📋 What you have:"
echo "📄 deployment_cert.der - Google's signing certificate"
echo "🔍 SHA1: 8E:37:6F:FD:D1:F5:21:1C:54:DC:30:00:9E:23:54:D5:58:80:49:D8"
echo ""

echo "🎯 What we need:"
echo "🔐 Original keystore with SHA1: C7:12:67:D2:68:E7:D1:26:34:95:5F:57:E1:78:9F:EA:91:78:61:30"
echo ""

echo "📱 Steps to get ORIGINAL keystore from Google Play Console:"
echo ""

echo "1. Go to Google Play Console"
echo "2. Select your app: GROWSMART"
echo "3. Navigate: Setup → App integrity → App signing"
echo ""

echo "🔍 Look for these options:"
echo "• 'Download app signing key' or 'Export private key'"
echo "• 'Reset upload key' (if available)"
echo "• 'Contact support' → 'App signing key recovery'"
echo ""

echo "⚠️  IMPORTANT:"
echo "• The .der file you downloaded is Google's certificate, not your keystore"
echo "• You need the original .keystore or .jks file you used to sign the app"
echo "• Google may require identity verification to release the original key"
echo ""

echo "📧 If you can't find download option:"
echo "Contact Google Play Support with:"
echo "• App name: GROWSMART"
echo "• Package: com.gogrowsmart.app"
echo "• Issue: Lost original keystore, need signing key recovery"
echo "• Expected SHA1: C7:12:67:D2:68:E7:D1:26:34:95:5F:57:E1:78:9F:EA:91:78:61:30"
echo ""

echo "🔄 Alternative: Request key reset"
echo "If Google can't recover the original key, they can reset it"
echo "This will allow you to use your NEW keystore (SHA1: 79:40:A1:D2:52:85:09:84:4F:F9:85:9F:D2:39:19:D2:AE:95:EA:39)"
