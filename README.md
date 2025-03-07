# Expo Auth Example with Google Sign-In 👋

This is an [Expo](https://expo.dev) project demonstrating a BFF (Backend-for-Frontend) architecture for Google authentication using Expo API Routes and JWTs.

## Features

- 🔐 Google Authentication
- 🎯 BFF Architecture with Expo API Routes
- 🎫 JWT-based token management (access & refresh tokens)
- 📱 Cross-platform support (iOS, Android, Web)
- 🔄 Token refresh mechanism
- 🛡️ Protected API routes

## Prerequisites

- [Google Cloud Console](https://console.cloud.google.com) project with OAuth 2.0 credentials
- [Expo Development Environment](https://docs.expo.dev/get-started/set-up-your-environment/)

## Environment Setup

1. Create a `.env.local` file in the root directory with:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
EXPO_PUBLIC_BASE_URL=your_base_url # e.g., http://localhost:8081
EXPO_PUBLIC_SCHEME=your_app_scheme # matches app.json scheme
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

## Authentication Flow

1. User initiates Google sign-in
2. App redirects to Google OAuth
3. Google redirects back to our API
4. Backend validates Google token
5. Backend issues JWT tokens (access + refresh)
6. Frontend stores tokens and uses them for API calls

## API Routes

- `GET /api/auth/login` - Initiates Google OAuth flow
- `GET /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/signout` - Sign out and invalidate tokens
- `GET /api/protected/data` - Example protected endpoint
- `GET /api/public/data` - Example public endpoint

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [JWT.io](https://jwt.io/)

## Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)
