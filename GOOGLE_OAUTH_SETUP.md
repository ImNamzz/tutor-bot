# Google OAuth Setup Guide

## Overview
Google OAuth authentication has been integrated into the tutor-bot application. Users can now sign in using their Google account in addition to traditional email/password authentication.

## Implementation Details

### Backend (Flask)
- **OAuth Library**: Uses `authlib` (v1.3.2+) for Google OAuth integration
- **Endpoints**:
  - `GET /api/auth/google/login` - Initiates OAuth flow, redirects to Google
  - `GET /api/auth/google/callback` - Handles Google's callback with auth code
  
- **Flow**:
  1. User clicks "Sign in with Google" button
  2. Backend redirects to Google's authorization page
  3. User grants permission on Google
  4. Google redirects back to backend callback endpoint
  5. Backend exchanges code for user info
  6. Backend creates/updates user account
  7. Backend generates JWT token
  8. Backend redirects to frontend with token

### Frontend (Next.js)
- **Login/Register Pages**: Both pages have "Sign in with Google" buttons
- **Auth Callback Page**: `/auth-callback` handles the redirect from backend
- **Token Storage**: JWT token stored in localStorage
- **Automatic Redirect**: After successful OAuth, redirects to home page

### Database Changes
- **User Model**: Added `google_id` field (String, nullable) to link Google accounts
- **Password Handling**: Users who sign in via Google have `hashed_password` set to `null`
- **Account Linking**: If a user signs in with Google using an email that already exists (from traditional registration), the accounts are automatically linked

## Configuration Required

### 1. Google Cloud Console Setup
You need to configure OAuth credentials in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Navigate to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure OAuth consent screen (add app name, user support email, etc.)
6. Create OAuth 2.0 Client ID:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `http://localhost:8000`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/auth/google/callback`
7. Copy the Client ID and Client Secret

### 2. Environment Variables
Add these to `backend/app/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
FRONTEND_URL=http://localhost:3000
```

**Current credentials** (already configured):
- `GOOGLE_CLIENT_ID=197796691766-i9ublotvb4gnqh7p71e1rf6i5d29b661.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET=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`

⚠️ **Important**: Verify the redirect URI `http://localhost:8000/api/auth/google/callback` is added to the authorized redirect URIs in Google Cloud Console.

## User Experience Flow

### New User (First Time Google Sign-In)
1. User clicks "Sign in with Google" on login/register page
2. Redirected to Google authorization page
3. User grants permission
4. Backend creates new user account with:
   - Username: Generated from Google name (e.g., "johndoe" or "johndoe1" if taken)
   - Email: From Google account
   - Google ID: Unique identifier from Google
   - Password: Set to `null` (no password needed)
5. JWT token generated and user logged in
6. Redirected to home page

### Existing User (Email Already Registered)
1. User previously registered with email/password
2. Later signs in with Google using same email
3. Backend links Google account to existing user (adds `google_id`)
4. User can now sign in either way (email/password OR Google)

### Returning Google User
1. User clicks "Sign in with Google"
2. Backend recognizes `google_id`
3. JWT token generated immediately
4. Redirected to home page

## Security Features

- **JWT Tokens**: Secure token-based authentication
- **Account Linking**: Prevents duplicate accounts with same email
- **No Password Storage**: Google OAuth users don't need passwords
- **HTTPS Ready**: OAuth flow supports HTTPS for production
- **Scope Limitation**: Only requests `openid email profile` (minimal permissions)

## Testing

### Test the OAuth Flow:
1. Start backend server: `python -m app.app` (in backend directory)
2. Start frontend: `npm run dev` (in root directory)
3. Navigate to `http://localhost:3000/auth/login`
4. Click "Sign in with Google"
5. Complete Google authorization
6. Verify redirect to home page with logged-in state

### Troubleshooting:
- **"redirect_uri_mismatch"**: Check Google Cloud Console redirect URIs
- **"invalid_client"**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- **"Failed to get user info"**: Check OAuth scopes and Google+ API is enabled
- **Token not stored**: Check browser console for localStorage errors

## Production Deployment

For production, update:

1. **Google Cloud Console**:
   - Add production domains to authorized origins and redirect URIs
   - Example: `https://yourdomain.com/api/auth/google/callback`

2. **Environment Variables**:
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```

3. **Backend redirect_uri** in `app.py`:
   ```python
   redirect_uri = os.getenv("GOOGLE_CALLBACK_URL", 'http://localhost:8000/api/auth/google/callback')
   ```

## Files Modified

### Backend:
- `backend/app/app.py` - Added OAuth routes and user handling
- `backend/app/models.py` - Added `google_id` field to User model
- `backend/requirements.txt` - Added `authlib==1.3.2`

### Frontend:
- `src/app/auth/login/page.tsx` - Updated Google button to use OAuth
- `src/app/auth/register/page.tsx` - Updated Google button to use OAuth
- `src/app/auth-callback/page.tsx` - Created callback handler
- `src/app/lib/config.ts` - Added Google OAuth endpoints

## Notes

- Users can have accounts with both password and Google OAuth linked
- Google OAuth does not require email verification (Google already verified)
- Username uniqueness is maintained by appending numbers if needed
- The OAuth flow is server-side (more secure than client-side)
