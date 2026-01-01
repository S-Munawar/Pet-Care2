# 🐾 Pet Care API Server

The backend service for the Pet Care application.  
Built with **Node.js**, **Express**, and **TypeScript**, it handles authentication, data persistence, and orchestration between the frontend and the ML inference service.

---

## 🏗️ Architecture

The server follows a layered architecture pattern:

```mermaid
graph TD
    Client[Web/Mobile Client] -->|HTTP/REST| Server[Express Server]
    
    subgraph "Server Layer"
        Server --> Auth[Auth Middleware]
        Auth --> Rate[Rate Limiter]
        Rate --> Router[API Routes]
        
        Router --> AuthCtrl[Auth Controller]
        Router --> UserCtrl[User Controller]
        Router --> PetCtrl[Pet Controller]
        Router --> HealthCtrl[Health Record Controller]
        Router --> MLCtrl[ML Analysis Controller]
        Router --> AICtrl[AI Chat Controller]
    end
    
    subgraph "Data & Services"
        AuthCtrl --> Firebase[Firebase Auth]
        UserCtrl --> MongoDB[(MongoDB)]
        PetCtrl --> MongoDB
        HealthCtrl --> MongoDB
        MLCtrl --> MLService[ML Inference Engine]
        AICtrl --> OpenAI[AI Provider]
    end
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher  
- **pnpm**: Package manager  
- **MongoDB**: Running instance (local or Atlas)  
- **Firebase Project**: For authentication  
- **ML Service**: Running ML inference server (optional for basic features)

---

## 1. Installation

Navigate to the server directory and install dependencies:

```bash
cd apps/server
pnpm install
```

---

## 2. Environment Configuration

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

### Required Variables

```ini
# Server Config
PORT=2000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/pet-care

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# ML Service Integration
ML_INFERENCE_URL=http://localhost:5000

# Optional: AI Chat
OPENAI_API_KEY=your-key-here
```

---

## 3. Database Setup

Ensure your MongoDB instance is running.  
The application automatically connects on startup.

To create an initial admin user (optional):

```bash
npx ts-node scripts/create-admin.ts
```

---

## 4. Running the Server

### Development Mode

Runs with hot-reloading:

```bash
pnpm dev
```

### Production Build

```bash
pnpm build
pnpm start
```

### Docker

```bash
docker build -t pet-care-server .
docker run -p 2000:2000 --env-file .env pet-care-server
```

---

## 📂 Project Structure

```
src/
├── config/         # Database and Firebase configuration
├── controllers/    # Request handlers (business logic)
├── middleware/     # Auth checks, rate limiting, error handling
├── models/         # Mongoose schemas (User, Pet, HealthRecord)
├── routes/         # API route definitions
├── services/       # External service integrations (ML Client)
└── utils/          # Helper functions
```

---

## 📡 API Endpoints

The API is prefixed with `/api`.

| Module | Method | Endpoint | Description |
|------|-------|----------|-------------|
| Auth | POST | `/auth/register` | Register a new user |
| Auth | POST | `/auth/login` | Login (verify Firebase token) |
| Users | GET | `/users/profile` | Get current user profile |
| Users | PUT | `/users/profile` | Update user profile |
| Pets | POST | `/pets` | Add a new pet |
| Pets | GET | `/pets` | List user's pets |
| Pets | GET | `/pets/:id` | Get pet details |
| Health | POST | `/health-records` | Create a health record |
| Health | GET | `/health-records/pet/:petId` | Get pet health history |
| ML | POST | `/ml-analysis/analyze` | Request health risk assessment |
| ML | GET | `/ml-analysis/status` | Check ML service availability |
| Vets | GET | `/vets` | Search for veterinarians |
| Vets | POST | `/vets/approve` | Approve vet application (Admin) |

---

## 🔒 Security Features

- **Authentication**  
  Protected routes require a valid Firebase ID token in the header:  
  `Authorization: Bearer <token>`

- **Role-Based Access Control (RBAC)**  
  Middleware restricts access to vet/admin-only endpoints.

- **Rate Limiting**  
  Throttles API requests to prevent abuse.

- **Input Validation**  
  All request bodies are validated before processing.

---

## 🧪 Testing

Run the test suite (if configured):

```bash
pnpm test
```

---
