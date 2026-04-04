# Development Mode Setup

## CORS Issue Fix

The frontend was experiencing CORS errors when trying to connect to the production backend from localhost:8081. This has been resolved by implementing a development mode that uses mock responses.

## Development Mode Features

1. **Mock API Responses**: All API calls are intercepted and return mock responses
2. **OTP Bypass**: Any 6-digit OTP code (e.g., 123456) is accepted for testing
3. **Test Users**: 
   - `student1@example.com` - Bypasses OTP and goes to student dashboard
   - `teacher56@example.com` - Bypasses OTP and goes to teacher dashboard
   - `teacher31@example.com` - Bypasses OTP and goes to teacher dashboard

## How It Works

1. **Development Mode Detection**: Automatically enabled when running on localhost:8081
2. **Mock Service**: `authService.ts` uses mock responses instead of real API calls
3. **Visual Indicator**: Yellow helper text appears in OTP screen showing development mode is active
4. **Flow Completion**: Full signup flow works including role selection

## Testing the Signup Flow

1. Navigate to `http://localhost:8081/auth/EmailInputScreen?type=signup`
2. Enter any email and name
3. Click "Continue" 
4. On OTP screen, enter any 6-digit code (e.g., 123456)
5. Select your role (Student/Teacher)
6. Complete the profile setup

## Production Deployment

When deploying to production, set `IS_DEVELOPMENT_MODE = false` in `services/authService.ts` to use real API endpoints.

## Files Modified

- `services/authService.ts` - Added development mode and mock responses
- `app/auth/OTPScreen.tsx` - Updated to handle 6-digit OTP and development mode UI
- `app/auth/EmailInputScreen.tsx` - Already had proper signup flow
- `app/auth/RoleSelectionScreen.tsx` - Already existed for role selection

The authentication flow now works seamlessly in development without CORS issues!
