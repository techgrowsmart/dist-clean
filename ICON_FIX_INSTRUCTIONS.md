# 🔧 Fix App Icon - Complete Instructions

## Problem
The app is showing the default circular React Native icon instead of the correct GROWSMART™ icon (`growsmart-icon.png`).

## Root Cause
The Android native resources (mipmap folders) contain the old default React Native icons instead of your custom icon.

## Solution

### Step 1: Restore Android Folder (if missing)
If the `android` folder was deleted, restore it:
```bash
cd /Users/matul/Desktop/Work/Gogrowsmart
git checkout android
```

### Step 2: Verify Configuration
Your `app.json` is already correctly configured:
- ✅ `icon`: "./assets/images/growsmart-icon.png"
- ✅ `android.adaptiveIcon.foregroundImage`: "./assets/images/growsmart-icon.png"
- ✅ `android.adaptiveIcon.backgroundColor`: "#ffffff"

### Step 3: Regenerate Android Resources with Correct Icon

**Option A: Using Expo Run (Recommended)**
```bash
cd /Users/matul/Desktop/Work/Gogrowsmart
npx expo run:android
```
This will automatically regenerate the Android native code with the correct icon.

**Option B: Using Expo Prebuild**
```bash
cd /Users/matul/Desktop/Work/Gogrowsmart
npx expo prebuild --platform android
```
This regenerates the android folder with icons from your app.json.

**Option C: Manual Build (if android folder exists)**
```bash
cd /Users/matul/Desktop/Work/Gogrowsmart/android
./gradlew clean
./gradlew bundleRelease
```

### Step 4: Verify Icon Files
After regeneration, check that the icon files are updated:
```bash
ls -lh android/app/src/main/res/mipmap-*/ic_launcher*.webp
```

The files should show your GROWSMART™ icon, not the default React Native icon.

### Step 5: Build and Test
```bash
cd android
./build-aab.sh
```

Then install the AAB on a device and verify the icon shows correctly.

---

## What Expo Does Automatically

When you run `expo run:android` or `expo prebuild`, Expo automatically:
1. Reads your `app.json` icon configuration
2. Generates all required icon sizes (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
3. Creates adaptive icon foreground images
4. Updates the mipmap resources
5. Configures the AndroidManifest.xml

---

## Troubleshooting

### If icon still shows default:
1. **Clean build cache:**
   ```bash
   cd android
   ./gradlew clean
   rm -rf app/build
   ```

2. **Uninstall old app from device:**
   ```bash
   adb uninstall com.gogrowsmart.app.mobile
   ```

3. **Rebuild and reinstall:**
   ```bash
   ./gradlew bundleRelease
   ```

### If android folder is missing:
Restore from git:
```bash
git checkout android
```

Or regenerate:
```bash
npx expo prebuild --platform android
```

---

## Verification Checklist

- [ ] `app.json` has correct icon path
- [ ] `assets/images/growsmart-icon.png` exists and is valid PNG
- [ ] Android folder exists
- [ ] Run `npx expo run:android` or `npx expo prebuild`
- [ ] Icon files in mipmap folders are updated
- [ ] Build AAB file
- [ ] Install on device and verify icon

---

**Status**: Configuration is correct. Just need to regenerate Android resources to apply the icon.
