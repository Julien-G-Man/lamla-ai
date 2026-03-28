# Accounts And Authentication

## Sign Up And Login Pages
Keywords: signup, sign up, login, account, username, email, password, register, authentication, create account, where to login

**To create an account:**
1. Click **Signup** in the top navigation menu
2. You'll go to the signup page at `/auth/signup`
3. Fill in:
   - Email address (this is your login username)
   - Username (your display name on the platform)
   - Password
4. Click the **Sign Up** button
5. You'll be redirected to verify your email

**Alternatively, sign up with Google:**
1. Click **Continue with Google** on the signup page
2. Select your Google account
3. Your account is created instantly — no email verification needed
4. Check your inbox for a welcome email from Lamla AI
5. You'll be redirected to your dashboard immediately

**To log in:**
1. Click **Login** in the top navigation menu
2. You'll go to the login page at `/auth/login`
3. Enter your email and password
4. Click **Sign in** or press Enter
5. After login, admins go to Admin Dashboard; regular users go to Dashboard

**Login page URL:** `/auth/login` (also works: `/login`)
**Signup page URL:** `/auth/signup` (also works: `/signup`)

## Email Verification
Keywords: email verification, verify email, verification link, resend verification, confirm email, verification email

**After signing up:**
1. You'll see a verification page at `/auth/verify-email`
2. Check your email inbox for a verification message
3. Click the link in the email
4. Your account is now verified and fully active

**If you don't receive the email:**
- Check your spam/junk folder
- Wait a few minutes - emails can be delayed
- Look for a "Resend verification email" button on the verification page

**Why verify?** Verified accounts have full platform access and trusted status.

## Profile Settings
Keywords: profile, update profile, profile image, avatar, account settings, display name, edit profile, my profile, photo, profile picture, upload photo

**To access your profile:**
1. Log in to your account
2. Click **Dashboard** in the top navigation
3. In the left sidebar, click **Profile**
4. Or go directly to `/profile`

**Profile page sections:**

### Account Information
**Edit your username and email:**
- **Username field** - Your display name on platform
  - Max 50 characters
  - Must be unique
  - Shows validation: ✓ "Looks good" when valid
- **Email Address field** - Your login email
  - Shows validation: ✓ "Valid email" when valid
- **Save Changes button** - Only enabled when changes detected and form is valid

**Validation feedback:**
- Red ✗ icon if field is invalid
- Green ✓ icon if field is valid
- Clear error messages below fields

### Profile Photo Section

**Upload a new profile picture:**

1. Look for the section labeled **Profile Photo**
2. Click the **file input box**
3. Select an image file from your device
4. File info appears: Name and size in MB
5. Click **Upload Photo** button
6. Watch for "Uploading..." message (button text changes)
7. See success message: "Photo updated" (green checkmark)

**Supported image formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

**Size requirements:**
- Maximum: 5 MB per image
- Larger files show error: "Image must be under 5 MB."

**Your profile picture:**
- Displays as large avatar in the hero section at top of Profile page
- If no picture uploaded, shows first letter of your username (e.g., "J" for "John")
- Can be changed/replaced anytime
- Each new upload replaces the previous one

**Where your photo appears:**
- Profile page hero section (large version)
- Dashboard (in some views)
- Comments and contributions across platform

**Troubleshooting photo uploads:**
- "No image selected" → Select a file before clicking Upload
- "Unsupported format" → Use JPEG, PNG, WebP, or GIF only
- "Image must be under 5 MB" → Compress image or choose smaller file
- "Upload failed" → Try again or use different image

## Dashboard Access
Keywords: dashboard, where is dashboard, access dashboard, my dashboard, user dashboard

**To access your dashboard:**
- Click **Dashboard** in the top navigation menu
- Or go to `/dashboard`

**Dashboard features:**
- Overview tab - Statistics and quick actions
- History tab - View past quizzes
- Uploads tab - Materials you've uploaded
- Profile tab - Account settings

**Admin users** automatically see the Admin Dashboard at `/admin-dashboard` with platform-wide statistics.

## Logout
Keywords: logout, log out, sign out, exit account, end session

**To log out:**
1. Click the **Logout** button in the top navigation menu
2. You'll be logged out and returned to the home page
3. Your session ends securely

## Password Security
Keywords: password reset, change password, password security, forgot password, reset password

**Security features:**
- Passwords are encrypted and never visible
- Show/hide password toggle on login page (eye icon)
- Secure login sessions
- Rate limiting prevents brute-force attacks

**Change password:** Access your profile settings when logged in
**Forgot password:** Use password reset on the login page
