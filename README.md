# Store Rating Web Application

A production-ready Full Stack Store Rating Web Application featuring Role-Based Access Control (RBAC), JWT authentication with secure refresh token rotation, Prisma ORM, PostgreSQL database, Express backend, and a premium dark glassmorphic React (Vite) dashboard interface styled with Tailwind CSS.

---

## System Architecture

The application is structured into two main decoupled services:
- **Backend Service**: An Express.js REST API using Prisma ORM to connect to a PostgreSQL database.
- **Frontend Service**: A Single Page Application (SPA) built with React.js (Vite), leveraging Tailwind CSS for custom styling, Axios for API orchestration, React Router for route shielding, and React Hook Form + Zod for robust input validation.

---

## Entity-Relationship (ER) Diagram

The database uses PostgreSQL with highly optimized relationships. Here is the relational map:

```mermaid
erDiagram
    USER ||--o{ STORE : "owns (1:N)"
    USER ||--o{ RATING : "submits (1:N)"
    STORE ||--o{ RATING : "receives (1:N)"
    
    USER {
        string id PK "UUID"
        string name "20-60 Characters"
        string email UK "Unique Address"
        string password "Hashed BCrypt"
        string address "Max 400 Characters"
        enum role "ADMIN | STORE_OWNER | USER"
        datetime createdAt
        datetime updatedAt
    }

    STORE {
        string id PK "UUID"
        string name "Storefront Name"
        string email UK "Unique Address"
        string address "Physical Address"
        string ownerId FK "Refers to USER.id"
        datetime createdAt
        datetime updatedAt
    }

    RATING {
        string id PK "UUID"
        string userId FK "Refers to USER.id"
        string storeId FK "Refers to STORE.id"
        int rating "Range 1 to 5"
        datetime createdAt
        datetime updatedAt
    }
```

---

## Folder Structures

### Backend Service
```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema definition
│   └── seed.js             # Seeds default admin, owners, stores, and ratings
├── src/
│   ├── controllers/
│   │   ├── authController.js       # Handles signups, logins, and passwords
│   │   ├── userController.js       # Administrative CRUD user controls
│   │   ├── storeController.js      # Register storefronts & listing analytics
│   │   ├── ratingController.js     # Validates score submission & updates
│   │   └── dashboardController.js  # Compiles admin cards & owner reviews
│   ├── middlewares/
│   │   └── auth.js         # Access verification & RBAC check middlewares
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── storeRoutes.js
│   │   ├── ratingRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   └── prisma.js       # Shared Prisma client connector
│   └── app.js              # Express app initialization
├── package.json
└── .env
```

### Frontend Service
```
frontend/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.jsx  # Responsive dashboard wrapper with sidebar
│   │   └── ProtectedRoute.jsx   # Role-based path shielding component
│   ├── context/
│   │   └── AuthContext.jsx      # Holds session, tokens, and registration state
│   ├── pages/
│   │   ├── Login.jsx            # Form validations & redirection
│   │   ├── Signup.jsx           # Account creation with role choices
│   │   ├── ChangePassword.jsx   # Shared security updates screen
│   │   ├── AdminDashboard.jsx   # System aggregate dashboard cards
│   │   ├── UserManagement.jsx   # User profiles CRUD, filters & sort tables
│   │   ├── UserDetails.jsx      # Owner details with owned store ratings
│   │   ├── StoreManagement.jsx  # Store management & owner assignments
│   │   ├── UserDashboard.jsx    # Browse, sort, page & submit store reviews
│   │   └── OwnerDashboard.jsx   # Owner average stats & client review tables
│   ├── services/
│   │   └── api.js               # Axios client with auto JWT rotation interceptor
│   ├── App.jsx                  # Main routing coordinator
│   ├── App.css                  # Cleared styling
│   ├── index.css                # Tailwind base imports
│   └── main.jsx
├── nginx.conf                   # Nginx config for static build routing
├── package.json
└── vite.config.js
```

---

## Database Design: DDL SQL Schema

The corresponding raw PostgreSQL schema compiled by Prisma ORM looks as follows:

```sql
-- Create Enum Type for Roles
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'STORE_OWNER');

-- Create Table Users
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "address" VARCHAR(400) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create Table Stores
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- Create Table Ratings
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- Create Unique Constraints
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Store_email_key" ON "Store"("email");
CREATE UNIQUE INDEX "Rating_userId_storeId_key" ON "Rating"("userId", "storeId");

-- Add Foreign Key Constraints
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## API Documentation

All request payloads require `Content-Type: application/json`. Protected endpoints require an `Authorization` header containing `Bearer <access_token>`.

### 1. Authentication APIs

*   **POST** `/api/auth/register`
    *   *Description*: Creates a new user profile (`USER` or `STORE_OWNER` only).
    *   *Request Body*:
        ```json
        {
          "name": "Alexander Montgomery Robinson",
          "email": "alexander.montgomery@example.com",
          "address": "404 Silicon Galleria Mall, Road 12",
          "password": "Password@123",
          "role": "USER"
        }
        ```
    *   *Response (201 Created)*:
        ```json
        {
          "message": "Registration successful",
          "accessToken": "eyJhbGciOi...",
          "refreshToken": "eyJhbGciOi...",
          "user": {
            "id": "u-12345",
            "name": "Alexander Montgomery Robinson",
            "email": "alexander.montgomery@example.com",
            "role": "USER",
            "address": "404 Silicon Galleria Mall, Road 12"
          }
        }
        ```

*   **POST** `/api/auth/login`
    *   *Description*: Authenticates credentials and returns a token pair. Sets the refresh token as an HTTP-only cookie.
    *   *Request Body*:
        ```json
        {
          "email": "alexander.montgomery@example.com",
          "password": "Password@123"
        }
        ```
    *   *Response (200 OK)*: Same user payload & tokens as register.

*   **POST** `/api/auth/refresh`
    *   *Description*: Rotates an expired Access Token using the Refresh Token.
    *   *Request Body*:
        ```json
        { "refreshToken": "eyJhbGciOi..." }
        ```
    *   *Response (200 OK)*: `{ "accessToken": "eyJhbGciOi..." }`

*   **POST** `/api/auth/logout`
    *   *Description*: Clears cookie caches and invalidates the session.

*   **PUT** `/api/auth/change-password` *(Protected)*
    *   *Description*: Modifies password details for logged-in user.
    *   *Request Body*:
        ```json
        {
          "currentPassword": "Password@123",
          "newPassword": "NewPassword@123"
        }
        ```

---

### 2. User Management APIs *(Protected)*

*   **GET** `/api/users` *(Admin Only)*
    *   *Query Parameters*: `page`, `limit`, `search`, `role`, `sortBy`, `sortOrder`
    *   *Response (200 OK)*:
        ```json
        {
          "data": [{ "id": "...", "name": "...", "email": "...", "role": "USER" }],
          "meta": { "total": 12, "page": 1, "limit": 10, "totalPages": 2 }
        }
        ```

*   **GET** `/api/users/:id`
    *   *Description*: Details of user profile. If target is a `STORE_OWNER`, also returns owned stores list & aggregate ratings.

*   **POST** `/api/users` *(Admin Only)*
    *   *Description*: Creates a user under any role (including `ADMIN`).

*   **PUT** `/api/users/:id`
    *   *Description*: Updates profile details (Name, Address, Email, Role). Roles can only be updated by `ADMIN`.

*   **DELETE** `/api/users/:id` *(Admin Only)*
    *   *Description*: Deletes a user profile and cascades delete connected resources.

---

### 3. Store APIs *(Protected)*

*   **GET** `/api/stores`
    *   *Query Parameters*: `page`, `limit`, `search`, `sortBy`, `sortOrder`
    *   *Description*: Lists stores with computed average rating, review counts, and the requester's personal rating.

*   **GET** `/api/stores/:id`
    *   *Description*: Returns details of the store storefront, complete with all user review scores.

*   **POST** `/api/stores` *(Admin Only)*
    *   *Description*: Registers a store storefront and attaches it to an owner.

*   **PUT** `/api/stores/:id` *(Admin / Owner of Store)*
    *   *Description*: Updates storefront details. Reassigning owners is restricted to `ADMIN`.

*   **DELETE** `/api/stores/:id` *(Admin / Owner of Store)*
    *   *Description*: Removes the store and deletes all submitted rating scores.

---

### 4. Rating APIs *(Protected)*

*   **POST** `/api/ratings` *(Normal User Only)*
    *   *Description*: Submits a rating between 1 and 5 stars for a store. Checks unique constraint (one review per store per user).
    *   *Request Body*: `{ "storeId": "store-uuid", "rating": 5 }`

*   **PUT** `/api/ratings/:id` *(Normal User Only)*
    *   *Description*: Updates an existing score. Checks ownership.

*   **GET** `/api/ratings/store/:storeId`
    *   *Description*: Retrieves a list of reviews for a store.

---

### 5. Dashboard Stats APIs *(Protected)*

*   **GET** `/api/dashboard/admin` *(Admin Only)*
    *   *Response*: Returns stats cards count: `{ "totalUsers": 12, "totalStores": 5, "totalRatings": 25, "roleCounts": { "admin": 1, "user": 8, "storeOwner": 3 } }`.

*   **GET** `/api/dashboard/store-owner` *(Store Owner Only)*
    *   *Response*: Returns stats regarding store rating aggregates: `{ "averageRating": 4.5, "totalReviews": 18, "storesCount": 2, "reviews": [...] }`.

---

## Deployment & Setup Guide

### Option 1: Run Locally (Direct Node process)

#### Prerequisites
- Node.js v20+
- PostgreSQL server (running on standard port `5432`)

#### Step 1: Backend Configuration
1. Open the [backend/](file:///c:/Users/kp562/OneDrive/Desktop/Assesment/backend) directory in your terminal.
2. Open the [.env](file:///c:/Users/kp562/OneDrive/Desktop/Assesment/backend/.env) file and edit the `DATABASE_URL` line to match your PostgreSQL password:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/store_rating?schema=public"
   ```
3. Run the migrations to build your database schema:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Run the seed script to pre-populate default profiles (Admin, Owners, Users, Stores):
   ```bash
   npm run db:seed
   ```
5. Launch the Express API development server:
   ```bash
   npm run dev
   ```

#### Step 2: Frontend Configuration
1. Open the [frontend/](file:///c:/Users/kp562/OneDrive/Desktop/Assesment/frontend) directory.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---

### Option 2: Run via Docker (Preconfigured container network)

To compile and link the services automatically inside Docker containers:

1. Make sure Docker Desktop is active on your system.
2. In the root directory `Assesment/`, run:
   ```bash
   docker-compose up --build
   ```
3. This creates a virtual network containing:
   - A PostgreSQL server (`db` service on port `5432`)
   - An API backend (`backend` service on port `5000`)
   - An Nginx web server serving the built React assets (`frontend` service on port `80`)
4. Access the web app directly at `http://localhost`.

---

## Default Accounts Seed Data

Use these accounts to evaluate dashboard screens after running the database seeder:

| Role | Email Address | Password | Name |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@storerating.com` | `Admin@123` | System Administrator Account |
| **Store Owner** | `john.owner@storerating.com` | `Owner@123` | Johnathan Store Owner Corp |
| **Normal User** | `alice.user@storerating.com` | `User@123` | Alice Victoria Robinson Smith |
| **Normal User** | `bob.user@storerating.com` | `User@123` | Robert Michael Jenkins Cooper |