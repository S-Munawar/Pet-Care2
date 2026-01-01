# 🐾 Pet Care Web Client

The frontend application for the Pet Care platform.  
Built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**, it provides the user interface for pet owners, veterinarians, and administrators to interact with the system.

---

## ⚡ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Authentication:** Firebase Auth
- **State Management:** React Context (`AuthContext`)
- **UI Components:** Shared workspace components (`@repo/ui`)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v18 or higher  
- **pnpm:** Package manager (recommended for monorepo/workspace support)  
- **Firebase Project:** Authentication must be enabled  

---

## 1. Installation

Navigate to the web application directory and install dependencies:

```bash
cd apps/web
pnpm install
```

---

## 2. Environment Configuration

Create a `.env.local` file in the `apps/web` directory.  
You can copy from `.env.example` or manually add the following variables.

### Required Firebase Configuration

These values can be found in the Firebase Console under  
**Project Settings → General → Your Apps**

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Backend Configuration

```bash
NEXT_PUBLIC_API_URL=http://localhost:2000/api
```

---

## 3. Running the Development Server

Start the application in development mode:

```bash
pnpm dev
```

The application will be available at:

```
http://localhost:3000
```

---

## 📂 Project Structure

```
apps/web/
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Protected user dashboard
│   ├── login/            # Authentication pages
│   ├── register/         # Registration flow
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── ui/               # Shared UI elements
│   └── ...               # Feature-specific components
├── context/              # React Context providers (Auth, etc.)
├── lib/                  # Utilities and configuration
│   └── firebase.ts       # Firebase initialization
└── public/               # Static assets
```

---

## 🔑 Key Features

### Authentication Flow

- Seamless login and registration pages
- Automatic redirection for authenticated users to the dashboard
- **Complete Registration** flow syncing users with the backend

### Dashboard

- Centralized overview for users after login

### Pet Management

- Add and manage pet profiles
- View pet-specific information

### Health Tracking

- Track medications, vaccinations, and vitals
- View historical health records

### Vet Finder

- Search for veterinarians
- Schedule and manage appointments

### Role-Based Access

- Tailored UI for:
  - Pet Owners
  - Veterinarians
  - Administrators

---

## 🛠️ Available Scripts

Run these commands from the `apps/web` directory:

| Command | Description |
|------|-------------|
| `pnpm dev` | Starts the development server on port 3000 |
| `pnpm build` | Builds the application for production |
| `pnpm start` | Starts the production server |
| `pnpm lint` | Runs ESLint for code quality |
| `pnpm check-types` | Runs TypeScript type checking |

---

## 📦 Deployment

This application is designed for **Vercel** or any platform supporting Next.js.

Deployment steps:

```
Push code to a Git repository
        ↓
Import the project into Vercel
        ↓
Add environment variables
        ↓
Deploy
```

---
