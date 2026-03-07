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
Keywords: profile, update profile, profile image, avatar, account settings, display name, edit profile, my profile

**To access your profile:**
1. Log in to your account
2. Click **Dashboard** in the top navigation
3. In the left sidebar, click **Profile**
4. Or go directly to `/profile`

**What you can manage:**
- View and edit your username (display name)
- See your email address
- Upload or change your profile picture
- View account information (join date, last login)
- Update account preferences

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
