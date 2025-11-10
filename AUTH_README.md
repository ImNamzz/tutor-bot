# Authentication Setup

This tutor-bot application now includes a complete authentication system with login, registration, and email verification.

## Features

### 🔐 Authentication Pages

1. **Login** (`/auth/login`)
   - Email and password authentication
   - Error handling for invalid credentials
   - Automatic redirect to resend verification if email not verified
   - "Remember me" via localStorage token storage

2. **Register** (`/auth/register`)
   - Username, email, and password fields
   - Password confirmation validation
   - Minimum password length (6 characters)
   - Success screen with "Check your email" message
   - Handles duplicate email/username errors

3. **Email Verification** (`/auth/verify-email/[token]`)
   - Automatic verification when user clicks email link
   - Success/error states with appropriate messaging
   - Redirects to login after successful verification

### 🔑 Authentication Flow

```
1. User registers → Receives verification email
2. User clicks link in email → Email verified
3. User logs in → Receives access token
4. Token stored in localStorage
5. Token sent with all protected API requests
6. User can logout to clear token
```

### 🛡️ Protected Routes

The main AI Tutor page (`/`) is now protected:
- Redirects to login if no valid token
- Shows logout button when authenticated
- Automatically checks authentication on page load

## API Integration

### Backend Requirements

Your backend server should be running at `http://localhost:8000` with these endpoints:

#### Authentication Endpoints
- `POST /api/register` - Create new user
- `POST /api/login` - Authenticate and get token
- `GET /api/verify_email/<token>` - Verify email
- `POST /api/resend_verification` - Resend verification email

#### Protected Endpoints (require Bearer token)
- `POST /api/start_session` - Start learning session
- `POST /api/chat` - Chat with AI tutor

### Token Storage

The authentication token is stored in `localStorage` under the key `access_token`:

```javascript
// Set token after login
localStorage.setItem("access_token", token);

// Get token for API requests
const token = localStorage.getItem("access_token");

// Clear token on logout
localStorage.removeItem("access_token");
```

### Making Protected API Requests

Use the auth utility functions from `/app/lib/auth.ts`:

```javascript
import { getAuthHeaders, handleAuthError } from '@/app/lib/auth';

// Make protected request
const response = await fetch('http://localhost:8000/api/start_session', {
  method: 'POST',
  headers: getAuthHeaders(),  // Automatically includes Bearer token
  body: JSON.stringify({ title: "...", transcript: "..." })
});

// Handle auth errors
if (!response.ok) {
  handleAuthError(response.status);  // Redirects to login if 401
}
```

## Files Created

### Pages
- `/app/auth/login/page.tsx` - Login page
- `/app/auth/register/page.tsx` - Registration page
- `/app/auth/verify-email/[token]/page.tsx` - Email verification page

### Utilities
- `/app/lib/auth.ts` - Authentication helper functions

### Modified Files
- `/app/page.tsx` - Added authentication check and logout button

## Usage

### For Development

1. **Start your backend server** (should be running on port 8000)
2. **Start the Next.js dev server**:
   ```bash
   npm run dev
   ```
3. **Navigate to** `http://localhost:3000`
4. **You'll be redirected to login** if not authenticated

### Testing the Flow

1. Click "Sign up" to create an account
2. Fill in username, email, password
3. Check your email for verification link
4. Click the verification link
5. Return to login and sign in
6. You'll be redirected to the main AI Tutor page
7. Use the logout button to sign out

## Security Notes

- Passwords are sent securely to the backend (use HTTPS in production)
- Access tokens are stored in localStorage (consider httpOnly cookies for production)
- All protected routes check for valid authentication
- 401 responses automatically redirect to login
- Tokens should have expiration times (implement refresh tokens for production)

## Customization

### Change Backend URL

Update the fetch URLs in:
- `/app/auth/login/page.tsx`
- `/app/auth/register/page.tsx`
- `/app/auth/verify-email/[token]/page.tsx`

Replace `http://localhost:8000` with your production API URL.

### Add More User Info

Modify the registration form in `/app/auth/register/page.tsx` to collect additional fields (name, phone, etc.).

### Customize Styling

All pages use your existing Tailwind CSS theme and UI components from `/app/components/ui/`.

## Troubleshooting

### "Network error" message
- Ensure backend server is running on port 8000
- Check CORS settings on backend
- Verify API endpoints match documentation

### Redirected to login immediately
- Check if token exists: `localStorage.getItem("access_token")`
- Verify token hasn't expired
- Check browser console for errors

### Email verification not working
- Ensure backend is configured to send emails
- Check spam folder
- Verify email service credentials on backend

## Next Steps

Consider adding:
- Password reset functionality
- Social login (Google, GitHub, etc.)
- Remember me checkbox (extended token expiration)
- Profile page for user settings
- Session timeout warnings
- Refresh token implementation
