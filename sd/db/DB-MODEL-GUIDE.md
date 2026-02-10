# Database Model & Access Guide

## Overview

This project uses **Sequelize ORM** to interact with a **PostgreSQL** database. The same Sequelize model classes serve two purposes:

1. **Database migrations** — schema creation, alteration, rollback (`db-migration/`)
2. **Runtime database access** — querying from the Express server (`server/`)

This is achieved by housing all model definitions and migration logic in a shared standalone package (`@ntwa/db-migration`), which the server imports as a local dependency.

---

## Layered Architecture (5 Layers)

```
① Endpoint (route handler)            server/modules/<domain>/endpoints/
     ↓ calls
② Service                             server/modules/<domain>/services/
     ↓ calls
③ Repository                          server/modules/<domain>/repository/
     ↓ imports model from
④ DatabaseManager (server wrapper)    server/utils/database/database.js
     ↓ imports & initializes from
⑤ db-migration package                db-migration/
```

### Layer ⑤ — `db-migration` (Model Definitions + Connection)

**Package:** `@ntwa/db-migration` (local dependency at `../db-migration`)

| File | Purpose |
|---|---|
| `db-migration/index.js` | Creates the raw `Sequelize` instance against Postgres via `DATABASE_URL`. Exports `{ sequelize, Sequelize }`. |
| `db-migration/models/index.js` | `initializeSequelize()` auto-discovers all `.js` model files in `models/`, registers them, wires up associations, and returns a `models` dictionary. |
| `db-migration/models/<entity>.js` | Individual Sequelize `Model` class definitions (columns, table name, options). **These are the true classes that talk to Postgres.** |
| `db-migration/migrations/` | Sequelize CLI migration files for schema changes (`up` / `down`). |

**Key detail:** `models/index.js` scans the `models/` directory at runtime, so adding a new model file is enough — no manual registration needed.

**Example — `models/user.js`:**
```javascript
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    static associate(models) { /* define associations here */ }
  }
  user.init({
    uuid: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    // ...
  }, {
    sequelize,
    modelName: 'user',
    tableName: 'users',
    timestamps: true,
  });
  return user;
};
```

---

### Layer ④ — `DatabaseManager` (Server-Side Wrapper)

**File:** `server/utils/database/database.js`

This is a **singleton** that:
- Imports `sequelize` and `Sequelize` from `@ntwa/db-migration/index.js`
- Imports `initializeSequelize` from `@ntwa/db-migration/models/index.js`
- Calls `initializeSequelize()` in its constructor to load all models
- Provides lifecycle helpers: `connect()`, `disconnect()`, `testConnection()`, `transaction()`
- **Exports named model references** so the rest of the server never imports `db-migration` directly:

```javascript
export { db, User, Note, Category, Sso, RegisterToken, /* ... */ };
```

> **Convention:** All server code should import models from `server/utils/database/database.js`, never from `db-migration` directly.

---

### Layer ③ — Repository

**Location:** `server/modules/<domain>/repository/<entity>Repository.js`

Each repository:
- Imports its model from Layer ④ (e.g., `import { User } from '../../../utils/database/database.js'`)
- Defines a class wrapping Sequelize model calls into domain-specific methods
- Exports a **singleton instance**

**Example — `userRepository.js`:**
```javascript
import { db, User } from '../../../utils/database/database.js';

class UserRepository {
    constructor(model) {
        this.model = model || User;
    }

    async createUser(data) {
        return await this.model.create({ ...data, phone: "", isActive: true });
    }

    async getUserByUsername(username) {
        return await this.model.findOne({ where: { username } });
    }
}

const userRepository = new UserRepository();
export { userRepository, UserRepository };
```

**Why a class with constructor injection?** Allows swapping the model in tests (dependency injection).

---

### Layer ② — Service

**Location:** `server/modules/<domain>/services/<entity>Service.js`

Each service:
- Imports its repository from Layer ③
- Defines a class with **static methods** containing business logic
- Orchestrates one or more repository calls

**Example — `userService.js`:**
```javascript
import { userRepository } from "../repository/userRepository.js";

class UserService {
    static async createUser({ username, email, hashedPassword }) {
        return await userRepository.createUser({ username, email, password: hashedPassword });
    }

    static async getUserByUsername(username) {
        return await userRepository.getUserByUsername(username);
    }
}

export { UserService };
```

---

### Layer ① — Endpoint (Route Handler)

**Location:** `server/modules/<domain>/endpoints/<feature>/index.js`

Each endpoint:
- Imports its service from Layer ②
- Is a standard Express router
- Handles only HTTP concerns: request parsing, response formatting, middleware (auth, validation)

**Example — login endpoint:**
```javascript
router.post('/login/userpass', async (req, res) => {
    const { username, password } = req.body;
    const user = await UserService.getUserByUsername(username);
    // ... verify password, sign JWT, return response
});
```

---

## End-to-End Data Flow Example

**"Get user by username"** during login:

```
POST /auth/user-authentication/login/userpass          ①  Endpoint
  → UserService.getUserByUsername(username)             ②  Service
    → userRepository.getUserByUsername(username)        ③  Repository
      → User.findOne({ where: { username } })          ④  DatabaseManager export
        → user model class (Sequelize ORM → Postgres)  ⑤  db-migration
```

---

## How to Add a New Domain Entity

Follow these steps (using "Category" as an example):

### 1. Model (Layer ⑤) — `db-migration/models/category.js`
Define the Sequelize model. This is auto-discovered by `models/index.js`.

### 2. Migration (Layer ⑤) — `db-migration/migrations/YYYYMMDDHHMMSS-create-category.js`
Create a migration file for the table schema:
```bash
cd db-migration
npm run migration:generate -- --name create-category
```

### 3. DatabaseManager export (Layer ④) — `server/utils/database/database.js`
Add a named export for the new model:
```javascript
const Category = models.category;
// ... add to the export block
```

### 4. Repository (Layer ③) — `server/modules/<domain>/repository/categoryRepository.js`
Create a repository class importing `Category` from Layer ④.

### 5. Service (Layer ②) — `server/modules/<domain>/services/categoryService.js`
Create a service class importing the repository from Layer ③.

### 6. Endpoint (Layer ①) — `server/modules/<domain>/endpoints/<feature>/index.js`
Create or update a route handler importing the service from Layer ②.

### 7. Mount the router — `server/modules/<domain>/endpoints/index.js`
Ensure the domain router mounts the new sub-router.

---

## Shared Package Relationship

```
┌─────────────────────────────────┐
│         db-migration/           │  ← standalone package (@ntwa/db-migration)
│                                 │
│  index.js        → Sequelize    │  ← connection instance
│  models/*.js     → Model defs   │  ← true ORM classes
│  models/index.js → auto-loader  │  ← initializeSequelize()
│  migrations/     → schema DDL   │  ← up/down migration files
│  config/         → DB config    │  ← per-environment settings
└────────────┬────────────────────┘
             │  imported as local dependency
             │  ("@ntwa/db-migration": "../db-migration")
             ▼
┌─────────────────────────────────┐
│           server/               │
│                                 │
│  utils/database/database.js     │  ← DatabaseManager singleton
│       ↕                         │     wraps db-migration, exports models
│  modules/<domain>/              │
│    repository/ → service/       │
│      → endpoints/               │  ← Express route handlers
└─────────────────────────────────┘
```

---

## Key Conventions

- **Never import `db-migration` directly** in domain code — always go through `server/utils/database/database.js`.
- **One repository per entity**, exported as a singleton.
- **Services use static methods** — no instance state, purely orchestration.
- **Endpoints are thin** — delegate all logic to services.
- **Constructor injection** in repositories allows test mocking.
- **Migration files** always implement both `up` and `down` methods.
- Migration naming: `YYYYMMDDHHMMSS-descriptive-name.js`.
