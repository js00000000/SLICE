# Easy Split (群組分帳)

A modern, mobile-friendly group expense splitting application built with React, TypeScript, and Firebase.

**Live Demo:** [https://easy-split-14.netlify.app](https://easy-split-14.netlify.app)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/js00000000/easy-split)

## Key Features

- 🚀 **Multi-Group Architecture**: Create, join, and manage multiple splitting groups simultaneously.
- 🔐 **Authentication**: Support for both Anonymous sign-in and Google Authentication for persistent data across devices.
- 🔗 **Direct Group Linking**: Share group IDs or URLs for instant access to specific group dashboards.
- 📊 **Real-time Balances**: Live calculation of who owes whom, optimized for equal splits.
- 🛡️ **Host Management**: Dedicated group hosts can manage members, rename groups, or clear all records.
- 📱 **Mobile First**: Fully responsive design with a clean, intuitive UI built with Tailwind CSS.
- 🔄 **State Persistence**: Remembers your last visited group and syncs joined groups to your user profile.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Routing**: React Router 7
- **State Management**: React Context API
- **Backend**: Firebase (Firestore & Auth)
- **Styling**: Tailwind CSS 4, Lucide Icons

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database**.
3. Enable **Authentication** and activate the **Google** and **Anonymous** providers.
4. Add a Web App to your project and copy the configuration.
5. Environment variables are required for the app to connect to your Firebase instance.

## Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
