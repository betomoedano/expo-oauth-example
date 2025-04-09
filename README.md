# 🔐 Cross-Platform Authentication with Expo: Google & Apple Sign-In Example

This is an [Expo](https://expo.dev) project demonstrating a BFF (Backend-for-Frontend) architecture for Google authentication using Expo API Routes and JWTs.

## Features

- 🔐 Google Authentication
-  Apple Authentication
- 🎯 BFF Architecture with Expo API Routes
- 🎫 JWT-based token management (for native)
- 🎫 Cookies-based session management (for web)
- 📱 Cross-platform support (iOS, Android, Web)
- 🔄 Token refresh mechanism
- 🛡️ Protected API routes

## 🎥 Google Video

  <a href="https://youtu.be/V2YdhR1hVNw">
    <img src="https://i.ytimg.com/vi_webp/V2YdhR1hVNw/maxresdefault.webp" height="380" alt="YouTube Video Preview">
  </a>

## 🎥 Apple Video

  <a href="https://youtu.be/tqxTijhYhp8">
    <img src="https://i.ytimg.com/vi_webp/tqxTijhYhp8/maxresdefault.webp" height="380" alt="YouTube Video Preview">
  </a>

## Prerequisites

- [Google Cloud Console](https://console.cloud.google.com) project with OAuth 2.0 credentials
- [Apple Developer Account](https://developer.apple.com/account/)

## This project supports both Cookies and Tokens

Using JWT tokens works well for native platforms but isn't ideal for web applications. Using cookies on web has several important advantages:

- Security: HTTP-only cookies cannot be accessed by JavaScript, protecting against XSS attacks
- Automatic inclusion: Cookies are automatically sent with every request to your domain
- CSRF protection: Can be combined with CSRF tokens for additional security
- Session management: Easier to invalidate sessions server-side
- Reduced client-side storage concerns: No need to manage token storage in localStorage/sessionStorage

The token api detects the platform and handle auth appropriately:

- For web requests, sets the token in a secure http-only cookie
- For native requests, returns the token in the response

## Authentication Flow

<img width="1268" alt="Shapes Mar 18 11 43" src="https://github.com/user-attachments/assets/3f9d6aeb-d9b0-467d-b194-20d5d0aa7305" />

## Environment Setup

1. Create a `.env.local` file in the root directory with:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret # use to sign jwt tokens
EXPO_PUBLIC_BASE_URL=your_base_url # e.g., http://localhost:8081
EXPO_PUBLIC_SCHEME=your_app_scheme:// # matches app.json scheme

# Generate yours at https://applekeygen.expo.app
APPLE_CLIENT_SECRET=
```

## Get Started

1. Install dependencies

   ```bash
   bun install
   ```

2. Run the app

   ```bash
   npx expo run:ios
   ```

## Project Structure

- `/app` - Main application code using file-based routing
- `/app/api` - Backend API routes (BFF)
  - `/auth` - Authentication endpoints
  - `/public` - Public endpoints
  - `/protected` - Protected endpoints requiring JWT
- `/components` - Reusable React components
- `/utils` - Utility functions and middleware

---

## 🖇️ Sign in with Apple in Expo (iOS + Web)

This setup supports Sign in with Apple for both iOS (native) and Web using Expo.

---

## 📱 iOS (Native with `expo-apple-authentication`)

```sh
npx expo install expo-apple-authentication
```

To enable the Sign In with Apple capability in your app, set the `ios.usesAppleSignIn` property to `true` in your project's app config:

```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true
    }
  }
}
```

Add the plugin:

```json
{
  "expo": {
    "plugins": ["expo-apple-authentication"]
  }
}
```

## 🌐 Web (OAuth via Expo Router API Routes)

## Environment Variables for Apple Sign In

For web-based Apple Sign In, you'll need to generate a client secret. This is a JWT token that your server uses to validate requests with Apple's servers.

1. Visit [Apple Key Generator](https://applekeygen.expo.app)
2. Enter your Apple Developer Team ID and Bundle Identifier
3. Generate and copy the client secret
4. Add it to your `.env` file:

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [JWT.io](https://jwt.io/)
- [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)

## Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)
