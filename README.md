# 🐾 Pet Care Platform

A comprehensive pet health and management platform built as a **high-performance monorepo**.  
It connects pet owners with veterinarians, tracks health records, and uses machine learning to assess pet health risks.

---

## 🏗️ Architecture

This project is structured as a **monorepo** using **Turborepo** and **pnpm workspaces**.

---

## 🧩 System Components

| Service | Path | Tech Stack | Description |
|-------|------|-----------|-------------|
| Web Client | `apps/web` | Next.js 16, React, Tailwind | Frontend interface for users and vets |
| API Server | `apps/server` | Node.js, Express, TypeScript | Main backend handling auth and data |
| ML Service | `apps/ml` | Python, Flask, Scikit-learn | Machine learning inference engine |
| Shared UI | `packages/ui` | React, Tailwind | Shared UI component library |
| Shared Lib | `packages/shared` | TypeScript | Shared types, constants, utilities |

---

## 🔄 Data Flow

```
Frontend (Web Client)
        ↓
Firebase Authentication
        ↓
API Server (Validation & Persistence)
        ↓
MongoDB (Data Storage)
        ↓
ML Service (Health Risk Analysis)
        ↓
API Server (Save Results)
        ↓
Frontend (Display Results)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **pnpm** (package manager)
- **Python** 3.9+ (for ML service)
- **Docker** (optional, for containers)
- **MongoDB** (local or Atlas)
- **Firebase Project** (authentication)

---

## 1. Installation

From the root directory, install all dependencies:

```bash
pnpm install
```

---

## 2. Environment Setup

Configure environment variables for each application:

- **Web Client**
  ```bash
  cp apps/web/.env.example apps/web/.env.local
  ```

- **API Server**
  ```bash
  cp apps/server/.env.example apps/server/.env
  ```

- **ML Service**
  ```bash
  cp apps/ml/.env.example apps/ml/.env
  ```

Refer to the README inside each app directory for detailed variable definitions.

---

## 3. Running the Development Environment

Start all JavaScript/TypeScript services using Turborepo:

```bash
pnpm dev
```

This starts:

```
apps/web     → http://localhost:3000
apps/server  → http://localhost:2000
```

---

### Running the ML Service

The ML service requires a Python environment and is typically run separately.

```bash
cd apps/ml
python app.py
```

Or using Docker:

```bash
cd apps/ml
docker compose up --build
```

---

## 🛠️ Development Workflow

### Build All Projects

```bash
pnpm build
```

Builds all apps and packages in dependency order.

---

### Linting

```bash
pnpm lint
```

Runs lint checks across the entire monorepo.

---

### Type Checking

```bash
pnpm check-types
```

Validates TypeScript types without emitting files.

---

## 📦 Shared Packages

### `@repo/ui`

Reusable React UI components:
- Buttons
- Cards
- Inputs
- Layout components

Used directly by the Web Client.

---

### `@repo/shared`

Shared TypeScript definitions:
- `User`
- `Pet`
- `HealthRecord`

Ensures **type safety** between frontend and backend.

---

### `@repo/eslint-config`

Centralized ESLint rules shared across projects.

---

### `@repo/typescript-config`

Base `tsconfig.json` configurations for consistent builds.

---

## 🐳 Docker Support

Each application includes its own Docker configuration.

Examples:

### ML Service

```bash
cd apps/ml
docker compose up --build
```

### API Server

```bash
cd apps/server
docker build -t pet-care-server .
```

A root-level Docker Compose file can be added to orchestrate the full stack.

---

## 📚 Documentation

Detailed documentation for individual components:

- Web Client Documentation
- API Server Documentation
- ML Service Documentation
- Authentication Implementation

Refer to each app’s `README.md` for deeper technical details.

---
