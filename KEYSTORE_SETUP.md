# Keystore Configuration - Clean Setup

## Current Configuration

### Single Keystore Setup
- **Keystore File**: `android/app/new_gogrowsmart_release.jks`
- **Alias**: `gogrowsmart`
- **Store Password**: `gogrowsmart123`
- **Key Password**: `gogrowsmart123`

### Configuration Files
- `android/gradle.properties` - Contains keystore reference
- `android/app/build.gradle` - Uses keystore for release builds
- `.github/workflows/android-build.yml` - CI/CD uses same keystore

### Verification
```bash
# Check keystore contents
keytool -list -keystore android/app/new_gogrowsmart_release.jks

# Build commands
npm run build:dev        # Development build
npm run build:preview    # Preview build
npm run build:prod       # Production APK
npm run build:prod-aab   # Production AAB
```

## Cleanup Actions Performed
1. ✅ Removed duplicate keystore files from `android-signing-backup/`
2. ✅ Removed 40+ unnecessary shell scripts
3. ✅ Kept only useful scripts: `build-production.sh` and `fix-icon.sh`
4. ✅ Updated version information to match current app version
5. ✅ Verified single keystore configuration across all files

## Build Process
The app now uses a single, consistent keystore for all release builds, eliminating confusion and potential build errors.

## CI/CD Integration
GitHub Actions workflow automatically:
1. Decodes the keystore from secrets
2. Places it at `android/app/new_gogrowsmart_release.jks`
3. Builds both APK and AAB for release
4. Deploys to Play Console on main branch pushes
