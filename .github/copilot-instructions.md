# Copilot Instructions - Note-Taking Web App

## Architecture Overview

This is a full-stack note-taking application split into three main workspaces:
- **`server/`**: Express.js backend with Node.js clustering (2 workers by default)
- **`frontend/`**: React + TypeScript SPA using Vite, React Router, TailwindCSS
- **`db-migration/`**: Standalone Sequelize ORM package for database schema management

### Key Architectural Patterns

**Modular Domain Structure**: Server modules follow domain-driven design in `server/modules/`:
- Each domain (e.g., `auth/`, `notes/`) contains: `endpoints/`, `services/`, `repository/`, `middleware/`, `__tests__/`
- Domain routers mount at `/auth`, `/notes` in [server/server.js](server/server.js)
- Example: Auth endpoints in [server/modules/auth/endpoints/index.js](server/modules/auth/endpoints/index.js) use sub-routers like `emailRegistration`

**Shared Database Package**: `db-migration` is imported as a local dependency (`"db-migration": "../db-migration"`) into server:
- Models auto-load from [db-migration/models/index.js](db-migration/models/index.js)
- Server wraps this in [server/utils/database/database.js](server/utils/database/database.js) as `DatabaseManager`
- Migration files include test environment overrides (see [migrations/20250918174435-create-user.js](db-migration/migrations/20250918174435-create-user.js#L14-L16))

**Clustering with Shared State**: [server/index.js](server/index.js) uses Node.js cluster module with 2 workers:
- Primary process forks workers and handles restarts
- Redis (`ioredis`) provides shared state across workers
- Socket.IO runs per-worker (consider sticky sessions for production)

## Development Workflows

### Running the Stack

**Backend** (from `server/`):
```bash
npm start  # Starts clustered server on port 3001
npm test   # Jest tests with babel-jest for ES modules
```

**Frontend** (from `frontend/`):
```bash
npm run dev      # Vite dev server on port 3000
npm run build    # Production build
```

**Database Setup** (from `db-migration/`):
```bash
npm run migrate           # Apply pending migrations
npm run migrate:undo      # Rollback last migration
npm run migration:generate -- --name add-column-name  # Create new migration
```

### Environment Dependencies

**PostgreSQL**: Managed via Podman (PowerShell scripts in `env/db-container/`):
- Production DB: Port 5432 (see [env/db-container/run.ps1](env/db-container/run.ps1))
- Test DB: Port 5433 (migrations hardcode test connection string for `ENVIRONMENT=test`)

**Redis**: Configured in `env/redis-container/` with Docker Compose
- Connection via `REDIS_URI` env var (see [server/utils/os/redis/redis.js](server/utils/os/redis/redis.js))
- Auto-retry strategy: 50ms * attempts, max 2s

### Testing Conventions

**Jest Configuration**: Both server and db-migration use Jest:
- Server: Babel transpilation for ES6 imports ([server/babel.config.js](server/babel.config.js))
- Tests placed in `__tests__/` folders within domain modules
- Integration tests may require running containers (see `env/*/test/` directories)

**Test Structure**: Domain-specific tests in [server/modules/*/\_\_tests\_\_/](server/modules):
- Example: [server/modules/auth/\_\_tests\_\_/auth.example.test.js](server/modules/auth/__tests__/auth.example.test.js)
- Socket tests: [server/socket/\_\_tests\_\_/socket.example.test.js](server/socket/__tests__/socket.example.test.js)

## Project-Specific Conventions

### Authentication Flow

JWT-based auth with email verification pattern:
1. Registration: Creates SSO entry in DB with `uuid`, sends verification email
2. Verification: `GET /auth/email-registration/verify/:uuid` marks SSO as verified
3. Protected routes: Use [middleware/jwt.js](server/modules/auth/middleware/jwt.js) `authenticateToken` + `authorizeRole('user')`
4. Token validation: Requires `JWT_SECRET` env var

### Database Models & Migrations

**Model Definitions**: Each model in `db-migration/models/` exports Sequelize model function:
- Auto-discovered by `models/index.js` (skips files with `.test.js`)
- Primary keys: UUIDs (e.g., [models/user.js](db-migration/models/user.js))

**Migration Patterns**: Sequelize CLI migrations with test environment override:
```javascript
if (process.env.ENVIRONMENT == 'test') {
  queryInterface = sequelize.getQueryInterface();
}
```
- Naming: `YYYYMMDDHHMMSS-descriptive-name.js`
- Always implement both `up` and `down` methods

### Frontend Routing

React Router v6 setup in [frontend/src/App.tsx](frontend/src/App.tsx):
- **AuthLayout**: Routes under `/auth` (login, signup, password reset)
- **DefaultLayout**: Main app routes at `/` (homepage, settings)
- Pages in `src/pages/`, layouts in `src/layouts/`

### WebSocket Integration

Socket.IO setup in [server/socket/index.js](server/socket/index.js):
- Initialized in [server.js](server/server.js#L29) via `setupSocket(httpServer)`
- CORS configured for `http://localhost:3000`
- Add domain handlers in `socket/index.js` (currently minimal implementation)

## Integration Points

**Email Service**: [server/utils/email/emailServices.js](server/utils/email/emailServices.js) uses Nodemailer
- Used in registration flow: [endpoints/emailRegistration/index.js](server/modules/auth/endpoints/emailRegistration/index.js#L26)
- Requires SMTP configuration in env vars

**CORS Configuration**: All services allow `localhost:3000` origin with credentials
- Express: [server/server.js](server/server.js#L13-L17)
- Socket.IO: [server/socket/index.js](server/socket/index.js#L5-L9)

**Redis Client**: Singleton pattern in [utils/os/redis/redis.js](server/utils/os/redis/redis.js)
- Call `initializeRedisClient()` at startup
- Null `maxRetriesPerRequest` for blocking operations compatibility

## Special Directories

**`sd/`**: Spike/design documents for experimental features (e.g., `sd/server/concurrency/`)
- Not part of main runtime - reference implementations and behavioral tests
- Contains Redis distributed lock examples

**`env/`**: Infrastructure as code
- Dockerfiles and PowerShell scripts for local development
- Test subdirectories with separate configurations for integration tests
