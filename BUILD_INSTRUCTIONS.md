# Build Instructions for GoGrowSmart App

## Development Build Setup

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to your Expo account: `eas login`

### Building Development APK
To fix the "No development build" error, run:

```bash
# Build development APK for testing
npm run build:dev

# Or using EAS directly
eas build --platform android --profile development
```

### Available Build Commands
- `npm run build:dev` - Development build with dev client
- `npm run build:preview` - Preview build for internal testing
- `npm run build:prod` - Production APK build
- `npm run build:prod-aab` - Production AAB build for Play Store

### Running the App
After building the development APK:

1. Install the APK on your device
2. Run the development server:
   ```bash
   npm start
   ```
3. Scan the QR code with your device running the development build

### CI/CD Pipeline
- **Main branch**: Automatically builds and deploys to Play Console internal track
- **Pull requests**: Builds APK and AAB for testing
- **Manual trigger**: Can build development APK via workflow_dispatch

### Keystore Configuration
- Keystore file: `android/app/new_gogrowsmart_release.jks`
- Alias: `gogrowsmart`
- Store password: Set in GitHub secrets (`KEYSTORE_PASSWORD`)
- Key password: Set in GitHub secrets (`KEY_PASSWORD`)

### Troubleshooting
If you get "No development build" error:
1. Run `npm run build:dev` to create a development build
2. Install the generated APK on your device
3. Start the development server with `npm start`
4. Connect your device to the same network
5. Scan the QR code from the terminal

### Environment Setup
Make sure your `.env` file contains:
```
EXPO_PUBLIC_API_URL=your_api_url
```

The app is configured to use `com.gogrowsmart.app.mobile` as the package name.
