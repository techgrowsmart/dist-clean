# Production Deployment Guide

## CI/CD Pipeline Setup

Your app is now configured for automatic production deployment to Google Play Console Internal Testing.

### What's Configured:

1. **GitHub Actions Workflow** (`.github/workflows/android-build.yml`)
   - Triggers on push to `main` branch
   - Manual trigger with release notes option
   - Builds production AAB using EAS
   - Automatically deploys to Internal Testing track
   - Version auto-bumping on each build

2. **EAS Configuration** (`eas.json`)
   - `production-aab` profile for store distribution
   - Internal testing track configured
   - Auto-completion of releases

### Required GitHub Secrets:

Make sure these secrets are configured in your GitHub repository:

- `EXPO_TOKEN`: Your Expo account token
- `PLAY_JSON_KEY`: Google Play Console service account JSON

### Deployment Process:

1. **Automatic Deployment**: Push to `main` branch
   ```bash
   git push origin main
   ```

2. **Manual Deployment with Release Notes**:
   - Go to Actions tab in GitHub
   - Run "Android Production Build and Deploy" workflow
   - Add custom release notes

3. **Development Build** (manual trigger only):
   - For testing before production

### Version Management:

- Versions auto-bump using `--version-scheme bump`
- Current version: 2.0.9 (versionCode: 13)
- Release notes stored in `whatsnew/en-US`

### Google Play Console:

- Package: `com.gogrowsmart.app.mobile`
- Track: Internal Testing
- Status: Completed (immediately available to testers)

### Testing:

1. Add testers in Google Play Console
2. They'll receive the app via Play Store link
3. No manual APK distribution needed

### Production Checklist:

- [ ] All secrets configured in GitHub
- [ ] Testers added in Google Play Console
- [ ] App listing complete
- [ ] Content rating complete
- [ ] Privacy policy URL set
