# Modular Express + TypeScript Backend Architecture

A reusable, production-ready pattern for building Express REST APIs with TypeScript, MongoDB (Mongoose), JWT authentication, and the [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html). Copy this structure to bootstrap any new project.

---

## Table of Contents

- [Project Setup](#project-setup)

- [Folder Structure](#folder-structure)

- [Entry Points](#entry-points)

- [Config Layer](#config-layer)

- [Versioned Routes](#versioned-routes)

- [Repository Pattern (ORM-Agnostic)](#repository-pattern-orm-agnostic)

- [Module Anatomy](#module-anatomy)

- [Utils](#utils)

- [Middlewares](#middlewares)

- [Seeding Setup](#seeding-setup)

- [Wiring a New Module (Checklist)](#wiring-a-new-module-checklist)

- [Request Flow](#request-flow)

---

## Project Setup

### 1. Initialize

```bash

mkdir my-api && cd my-api

npm init -y

npx tsc --init

```

### 2. Install Dependencies

**Runtime:**

```bash

npm install express mongoose dotenv cors cookie-parser bcrypt jsonwebtoken ms express-validator swagger-jsdoc swagger-ui-express

```

**Dev:**

```bash

npm install -D typescript ts-node-dev tsconfig-paths @types/node @types/express @types/cors @types/cookie-parser @types/bcrypt @types/jsonwebtoken @types/ms @types/swagger-jsdoc @types/swagger-ui-express @faker-js/faker

```

### Package Reference

| Package              | Type    | Purpose                                                            |

| -------------------- | ------- | ------------------------------------------------------------------ |

| `express`            | Runtime | HTTP server framework                                              |

| `mongoose`           | Runtime | MongoDB ODM — schema validation, relationships, query building     |

| `dotenv`             | Runtime | Load `.env` variables into `process.env`                           |

| `cors`               | Runtime | Cross-Origin Resource Sharing middleware                           |

| `bcrypt`             | Runtime | Password hashing (salt rounds)                                     |

| `jsonwebtoken`       | Runtime | Generate and verify JWTs for stateless auth                        |

| `ms`                 | Runtime | Convert human-readable durations (`"1d"`) to milliseconds          |

| `express-validator`  | Runtime | Request body validation middleware (wraps validator.js)            |

| `swagger-jsdoc`      | Runtime | Generate OpenAPI spec from JSDoc comments in route files           |

| `swagger-ui-express` | Runtime | Serve interactive Swagger UI at `/api-docs`                        |

| `cookie-parser`      | Runtime | Parse `Cookie` header into `req.cookies` (required for refresh token reads) |

| `typescript`         | Dev     | TypeScript compiler                                                |

| `ts-node-dev`        | Dev     | Hot-reload dev server for TypeScript                               |

| `tsconfig-paths`     | Dev     | Resolve `@/` path aliases at runtime (reads `tsconfig.json` paths) |

| `@faker-js/faker`    | Dev     | Generate realistic fake data for seeders                           |

| `@types/*`           | Dev     | Type definitions for all runtime packages                          |

### 3. Configure TypeScript

```json
// tsconfig.json

{
  "compilerOptions": {
    "target": "ES2022",

    "module": "CommonJS",

    "strict": true,

    "esModuleInterop": true,

    "skipLibCheck": true,

    "resolveJsonModule": true,

    "outDir": "./dist",

    "rootDir": "./",

    "baseUrl": "./",

    "paths": {
      "@/*": ["src/*"]
    }
  },

  "include": ["src/**/*"]
}
```

> **`@/*` path alias** — allows `import { AppError } from "@/utils/app-error.util"` instead of fragile `../../utils/...` paths. Requires `tsconfig-paths` at runtime via `-r tsconfig-paths/register`.

### 4. Configure package.json Scripts

```json
{
  "scripts": {
    "start": "node dist/server.js",

    "build": "npx tsc",

    "dev": "npx ts-node-dev -r dotenv/config -r tsconfig-paths/register --files src/server.ts",

    "seedData": "npx ts-node -r dotenv/config -r tsconfig-paths/register src/scripts/seed.ts",

    "seedAdmin": "npx ts-node -r dotenv/config -r tsconfig-paths/register src/scripts/seeding/super-admin.seeder.ts"
  }
}
```

| Script              | What it does                                                    |

| ------------------- | --------------------------------------------------------------- |

| `npm run dev`       | Start dev server with hot-reload, dotenv, and `@/` path aliases |

| `npm run build`     | Compile TypeScript to `dist/`                                   |

| `npm start`         | Run compiled production server                                  |

| `npm run seedData`  | Run master seeder (clears + seeds everything)                   |

| `npm run seedAdmin` | Run only the super admin seeder                                 |

### 5. Create `.env`

```env

PORT=5000

NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/my_app

ACCESS_SECRET=your-access-secret-here

REFRESH_SECRET=your-refresh-secret-here

JWT_ACCESS_TOKEN_EXPIRES_IN=1h

JWT_REFRESH_TOKEN_EXPIRES_IN=1d

SUPER_ADMIN_EMAIL=admin@example.com

SUPER_ADMIN_PASSWORD=admin123

```

---

## Folder Structure

```

src/

├── app.ts                             # Express app setup (middleware, routes, error handler)

├── server.ts                          # HTTP server start

├── config/

│   ├── app.config.ts                  # Centralized env config object

│   ├── db.config.ts                   # MongoDB connection

│   └── swagger.config.ts             # Swagger/OpenAPI spec generation

├── middlewares/

│   ├── auth.middleware.ts             # protect (JWT verify) + restrictTo (role guard)

│   ├── error.middleware.ts            # Global error handler (dev vs prod)

│   └── validate-request.middleware.ts # express-validator result checker

├── utils/

│   ├── api-response.util.ts           # ApiResponse class + sendSuccess() helper

│   ├── app-error.util.ts              # AppError class (operational errors)

│   └── crud.util.ts                   # IBaseRepository<T> interface + MongooseRepository<T>

├── routes/

│   └── v1.route.ts                    # Aggregates all module routes under /api/v1

├── modules/

│   └── <module_name>/                 # One folder per domain module

│       ├── <module>.entity.ts         # Pure TS types, interfaces, enums (no lib imports)

│       ├── <module>.dto.ts            # Data Transfer Objects (create/update shapes)

│       ├── <module>.model.ts          # Mongoose schema + document interface + model

│       ├── <module>.service.ts        # Business logic class (uses repository)

│       ├── <module>.controller.ts     # HTTP handler class (uses service)

│       ├── <module>.validator.ts      # express-validator chains

│       ├── <module>.route.ts          # Express Router wiring

│       ├── models/                    # (optional) Sub-dir for multiple models

│       └── utils/                     # (optional) Module-specific helpers

└── scripts/

    ├── seed.ts                        # Master seeder (orchestrates all)

    └── seeding/

        ├── templates.ts               # Static reference data

        ├── super-admin.seeder.ts      # Super admin generator (standalone-capable)

        ├── employee.seeder.ts         # Employee user generator

        ├── department.seeder.ts       # Department generator

        ├── job.seeder.ts              # Job generator

        └── applicant.seeder.ts        # Applicant generator

```

---

## Entry Points

### `server.ts` — Starts the HTTP server

```typescript
import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### `app.ts` — Express app configuration

```typescript
import "dotenv/config";

import express, { NextFunction, Request, Response } from "express";

import cors from "cors";

import cookieParser from "cookie-parser";

import connectToDatabase from "./config/db.config";

import v1Routes from "./routes/v1.route";

import { globalErrorHandler } from "./middlewares/error.middleware";

import { AppError } from "./utils/app-error.util";

import swaggerUi from "swagger-ui-express";

import swaggerSpec from "./config/swagger.config";

const app = express();

connectToDatabase();

app.use(cors({

  origin: process.env.CLIENT_URL || true, // reflect origin in dev; set CLIENT_URL in prod

  credentials: true,                      // required for httpOnly cookie to be sent/received

}));

app.use(express.json());

app.use(cookieParser());                  // required for req.cookies (refresh token reads)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1", v1Routes);

// 404 catch-all

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler (must be last middleware)

app.use(globalErrorHandler);

export default app;
```

**Key points:**

- `connectToDatabase()` runs on import

- All routes live under `/api/v1` — add `/api/v2` later without breaking v1

- Swagger UI served at `/api-docs`

- 404 handler catches unmatched routes

- `globalErrorHandler` is the single error exit for the entire app

- `cors({ credentials: true })` is required so browsers accept `Set-Cookie` responses

- `cookieParser()` must come before routes so `req.cookies` is populated for refresh token reads

---

## Config Layer

### `app.config.ts` — Centralized, type-safe env config

```typescript
const config = {
  env: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 3000,

  debug: process.env.APP_DEBUG === "true",

  db: {
    url: process.env.MONGODB_URI || "mongodb://localhost:27017/my_app",
  },

  jwt: {
    accessSecret: process.env.ACCESS_SECRET || "access secret",

    refreshSecret: process.env.REFRESH_SECRET || "refresh secret",

    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "1h",

    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "1d",
  },

  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || "admin@example.com",

    password: process.env.SUPER_ADMIN_PASSWORD || "admin123",
  }, // Extend: email, storage, feature flags, etc.
};

export default config;
```

### `db.config.ts` — MongoDB connection

```typescript
import mongoose from "mongoose";

import config from "./app.config";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.db.url);

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);

    process.exit(1);
  }
};

export default connectToDatabase;
```

### `swagger.config.ts` — OpenAPI auto-docs from JSDoc

```typescript
import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: { title: "My API", version: "1.0.0" },

    servers: [{ url: "http://localhost:5000/api/v1" }],

    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },

    security: [{ bearerAuth: [] }],
  },

  apis: [
    "./src/routes/*.ts", // Health check, etc.

    "./src/modules/**/*.route.ts", // All module routes

    "./src/modules/**/*.dto.ts", // DTO definitions
  ],
};

export default swaggerJSDoc(options);
```

---

## Versioned Routes

### `routes/v1.route.ts` — Central route aggregator

```typescript
import express from "express";

import authRoutes from "@/modules/auth/auth.route";

import userRoutes from "@/modules/user/user.route";

import departmentRoutes from "@/modules/departments/departments.route";

// ... import more module routes

const router = express.Router();

// Health check

router.get("/health", (_, res) => {
  res.status(200).json({ ok: true });
});

// Mount modules

router.use("/auth", authRoutes);

router.use("/user", userRoutes);

router.use("/departments", departmentRoutes);

// router.use("/products", productRoutes);  ← add new modules here

export default router;
```

**To add API v2:** Create `routes/v2.route.ts` and mount in `app.ts` as `app.use("/api/v2", v2Routes)`.

---

## Repository Pattern (ORM-Agnostic)

> Based on the [Repository Pattern (Martin Fowler)](https://martinfowler.com/eaaCatalog/repository.html)

The key architectural rule: **services never know which ORM is used.** They interact only with the `IBaseRepository<T>` interface. The concrete implementation (`MongooseRepository`) can be swapped for Prisma, TypeORM, Sequelize, etc., without touching any service code.

```

┌─────────────────┐    depends on     ┌──────────────────────┐

│  Service (class) │ ────────────────► │  IBaseRepository<T>  │

│                  │    interface      │  (abstract contract) │

└─────────────────┘                   └──────────┬───────────┘

                                                 │ implements

                                      ┌──────────▼───────────┐

                                      │ MongooseRepository<T> │ ◄── swap this

                                      │ (concrete class)      │     for SQL, etc.

                                      └──────────────────────┘

```

### `IBaseRepository<T>` — The contract

```typescript
export interface IBaseRepository<T> {
  create(data: Partial<T>): Promise<T>;

  createMany(data: Partial<T>[]): Promise<T[]>;

  findAll(filter?: Record<string, any>, options?: any): Promise<T[]>;

  findById(id: string): Promise<T | null>;

  findOne(filter: Record<string, any>): Promise<T | null>;

  update(id: string, data: Partial<T>): Promise<T | null>;

  delete(id: string): Promise<boolean>;

  deleteMany(filter: Record<string, any>): Promise<boolean>;
}
```

### `MongooseRepository<T>` — Concrete Mongoose implementation

```typescript
import { Model, Document, UpdateQuery, QueryOptions } from "mongoose";

export class MongooseRepository<
  T extends Document,
> implements IBaseRepository<T> {
  constructor(private _model: Model<T>) {}

  async create(data: Partial<T>) {
    return this._model.create(data);
  }

  async createMany(data: Partial<T>[]) {
    return this._model.insertMany(data) as unknown as Promise<T[]>;
  }

  async findAll(filter = {}, options: QueryOptions = {}) {
    return this._model.find(filter, null, options).exec();
  }

  async findById(id: string) {
    return this._model.findById(id).exec();
  }

  async findOne(filter: Record<string, any>) {
    return this._model.findOne(filter).exec();
  }

  async update(id: string, data: UpdateQuery<T>) {
    return this._model

      .findByIdAndUpdate(id, data, { new: true, runValidators: true })

      .exec();
  }

  async delete(id: string) {
    return !!(await this._model.findByIdAndDelete(id).exec());
  }

  async deleteMany(filter: Record<string, any>) {
    return (await this._model.deleteMany(filter).exec()).acknowledged;
  }
}
```

### How to swap ORM

1. Create `PrismaRepository<T>` (or `TypeORMRepository<T>`) implementing `IBaseRepository<T>`

2. Change the service constructors to use the new repository

3. **Zero changes** to controllers, routes, validators, or middlewares

---

## Module Anatomy

Everything uses **classes** — repositories, services, controllers. Every module lives in `src/modules/<name>/` and contains up to 7 files:

| #   | File                     | Responsibility                         | Imports from                 |

| --- | ------------------------ | -------------------------------------- | ---------------------------- |

| 1   | `<module>.entity.ts`     | Pure TS types, interfaces, enums       | Nothing (no library imports) |

| 2   | `<module>.dto.ts`        | Create/Update data shapes              | Other DTOs (cross-module)    |

| 3   | `<module>.model.ts`      | Mongoose schema + model                | `mongoose`                   |

| 4   | `<module>.service.ts`    | Business logic (class)                 | Repository, AppError         |

| 5   | `<module>.controller.ts` | HTTP handlers (class)                  | Service, Express types       |

| 6   | `<module>.validator.ts`  | Validation rules                       | `express-validator`          |

| 7   | `<module>.route.ts`      | Wires routes → middleware → controller | Controller, middlewares      |

---

### 1. Entity

**File:** `<module>.entity.ts` — Pure TypeScript types, **no library imports**.

```typescript
// user.entity.ts

export interface BaseUser {
  id: string;

  name: string;

  email: string;

  createdAt: Date;

  updatedAt: Date;
}

export enum UserRole {
  APPLICANT = "APPLICANT",

  EMPLOYEE = "EMPLOYEE",

  ADMIN = "ADMIN",

  SUPER_ADMIN = "SUPER_ADMIN",
}

export const userRoles = [
  UserRole.SUPER_ADMIN,

  UserRole.ADMIN,

  UserRole.EMPLOYEE,

  UserRole.APPLICANT,
];

export interface Applicant extends BaseUser {
  role: UserRole.APPLICANT;
}

export interface Employee extends BaseUser {
  role: UserRole.EMPLOYEE;
}

export interface Admin extends BaseUser {
  role: UserRole.ADMIN;
}

export type User = Applicant | Employee | Admin;
```

---

### 2. DTOs

**File:** `<module>.dto.ts` — Data Transfer Objects defining what the client sends.

```typescript
// user.dto.ts

export class CreateUserDto {
  name!: string; // required → !:

  email!: string;

  password!: string;
}

export class UpdateUserDto {
  name?: string; // optional → ?:

  email?: string;

  password?: string;
}
```

DTOs can reference other module DTOs:

```typescript
// auth.dto.ts

import type { CreateUserDto as User } from "@/modules/user/user.dto";

export class LoginUserDto {
  email!: string;

  password!: string;
}

export class LoginResponseDto {
  token!: string;

  user!: User;
}
```

---

### 3. Model

**File:** `<module>.model.ts` — Mongoose schema, document interface, model export.

```typescript
// department.model.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
  name: string;

  designations: string[];

  description: string;

  createdAt: Date;

  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },

    designations: [{ type: String, required: true }],

    description: { type: String, required: true },
  },

  { timestamps: true }, // auto createdAt + updatedAt
);

export const DepartmentModel = mongoose.model<IDepartment>(
  "Department",

  DepartmentSchema,
);
```

For modules with multiple models (e.g. `user`), create a `models/` sub-directory.

---

### 4. Service

**File:** `<module>.service.ts` — All business logic. Uses the repository — **never touches Mongoose directly**.

```typescript
// department.service.ts

import { MongooseRepository } from "@/utils/crud.util";

import { DepartmentModel, IDepartment } from "./department.model";

import { AppError } from "@/utils/app-error.util";

export class DepartmentsService {
  private repo: MongooseRepository<IDepartment>;

  constructor() {
    this.repo = new MongooseRepository(DepartmentModel);
  }

  async getAllDepartments() {
    return await this.repo.findAll();
  }

  async getDepartmentById(id: string) {
    const dept = await this.repo.findById(id);

    if (!dept) throw new AppError("Department not found", 404);

    return dept;
  }

  async createDepartment(data: Partial<IDepartment>) {
    const existing = await this.repo.findOne({ name: data.name });

    if (existing) throw new AppError("Department already exists", 400);

    return await this.repo.create(data);
  }

  async updateDepartment(id: string, data: Partial<IDepartment>) {
    const dept = await this.repo.findById(id);

    if (!dept) throw new AppError("Department not found", 404);

    return await this.repo.update(id, data);
  }

  async deleteDepartment(id: string) {
    const dept = await this.repo.findById(id);

    if (!dept) throw new AppError("Department not found", 404);

    return await this.repo.delete(id);
  }
}
```

**Service-to-service dependency injection** (auth depends on user):

```typescript
// auth.service.ts

import type { UserService } from "@/modules/user/user.service";

export class AuthService {
  // Injected via constructor — NOT instantiated internally

  constructor(private userService: UserService) {}

  async login(data: LoginUserDto) {
    const user = await this.userService.getUserByEmail(
      data.email.toLowerCase(),
    );

    if (!user) throw new AppError("Invalid email/password", 401);

    const valid = await bcrypt.compare(data.password, user.password!);

    if (!valid) throw new AppError("Invalid email/password", 401);

    return user;
  }

  async register(data: CreateUserDto) {
    const hashed = await bcrypt.hash(data.password, 10);

    return await this.userService.createUser({ ...data, password: hashed });
  }
}
```

**Rules:**

- Never touches `req`/`res` — that's the controller's job

- Throws `AppError` for domain errors

- Only accesses data through `IBaseRepository` methods

- Cross-module dependencies are injected via constructor

---

### 5. Controller

**File:** `<module>.controller.ts` — HTTP layer. Accepts `req`/`res`, delegates to service.

```typescript
// departments.controller.ts

import { NextFunction, Request, Response } from "express";

import { DepartmentsService } from "./department.service";

export class DepartmentsController {
  private departmentsService: DepartmentsService;

  constructor() {
    this.departmentsService = new DepartmentsService();
  }

  public async getAllDepartments(
    req: Request,

    res: Response,

    next: NextFunction,
  ) {
    try {
      const departments = await this.departmentsService.getAllDepartments();

      res.status(200).json({ status: "success", data: departments });
    } catch (error) {
      next(error);
    }
  }

  public async createDepartment(
    req: Request,

    res: Response,

    next: NextFunction,
  ) {
    try {
      const dept = await this.departmentsService.createDepartment(req.body);

      res.status(201).json({ status: "success", data: dept });
    } catch (error) {
      next(error);
    }
  } // ... getDepartmentById, updateDepartment, deleteDepartment (same pattern)
}
```

**Rules:**

- Every method: `async` + `try/catch` → `next(error)`

- No business logic — extract params and delegate to service

- Controller owns its service via constructor

---

### 6. Validator

**File:** `<module>.validator.ts` — `express-validator` chains.

```typescript
// departments.validator.ts

import { body } from "express-validator";

export const createDepartmentValidator = [
  body("name").notEmpty().withMessage("Department name is required"),

  body("description").notEmpty().withMessage("Description is required"),

  body("designations")
    .isArray({ min: 1 })

    .withMessage("At least one designation is required"),
];

export const updateDepartmentValidator = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),

  body("description")
    .optional()

    .notEmpty()

    .withMessage("Description cannot be empty"),

  body("designations").optional().isArray().withMessage("Must be an array"),
];
```

**Pattern:** Create validators → required (`.notEmpty()`). Update validators → optional first (`.optional()`).

---

### 7. Route

**File:** `<module>.route.ts` — Wires HTTP verbs → middleware pipeline → controller.

```typescript
// departments.route.ts

import { Router } from "express";

import { DepartmentsController } from "./departments.controller";

import { protect, restrictTo } from "@/middlewares/auth.middleware";

import { UserRole } from "@/modules/user/user.entity";

import {
  createDepartmentValidator,
  updateDepartmentValidator,
} from "./departments.validator";

import { validateRequest } from "@/middlewares/validate-request.middleware";

const controller = new DepartmentsController();

const router = Router();

router.use(protect); // All routes require auth

// Pipeline: protect → restrictTo → validator → validateRequest → controller

router.get(
  "/",

  restrictTo(UserRole.ADMIN, UserRole.SUPER_ADMIN),

  controller.getAllDepartments.bind(controller),
);

router.get(
  "/:id",

  restrictTo(UserRole.ADMIN, UserRole.SUPER_ADMIN),

  controller.getDepartmentById.bind(controller),
);

router.post(
  "/",

  restrictTo(UserRole.SUPER_ADMIN),

  createDepartmentValidator,

  validateRequest,

  controller.createDepartment.bind(controller),
);

router.put(
  "/:id",

  restrictTo(UserRole.SUPER_ADMIN),

  updateDepartmentValidator,

  validateRequest,

  controller.updateDepartment.bind(controller),
);

router.delete(
  "/:id",

  restrictTo(UserRole.SUPER_ADMIN),

  controller.deleteDepartment.bind(controller),
);

export default router;
```

> **Always use `.bind(controller)`** to preserve `this` context when passing class methods.

**Auth routes** (no `protect` needed for public endpoints):

```typescript
// auth.route.ts — demonstrates constructor dependency injection

const userService = new UserService();

const authService = new AuthService(userService); // ← DI

const authController = new AuthController(authService);

router.post(
  "/login",

  loginValidator,

  validateRequest,

  authController.login.bind(authController),
);

router.post(
  "/register",

  registerValidator,

  validateRequest,

  authController.register.bind(authController),
);

router.post("/refresh", authController.handleRefreshToken.bind(authController));

router.post("/logout", authController.logout.bind(authController));
```

---

## Utils

### `AppError` — Operational error class

```typescript
export class AppError extends Error {
  public readonly statusCode: number;

  public readonly status: string; // "fail" (4xx) or "error" (5xx)

  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;

    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
```

### `ApiResponse` + `sendSuccess()`

```typescript
export class ApiResponse {
  public readonly success: boolean;

  constructor(
    public readonly statusCode: number,

    public readonly data: any,

    public readonly message: string = "Success",
  ) {
    this.success = statusCode < 400;
  }
}

export const sendSuccess = (
  res: Response,

  data: any,

  message = "Success",

  statusCode = 200,
) => {
  return res

    .status(statusCode)

    .json(new ApiResponse(statusCode, data, message));
};
```

---

## Auth Pattern

### Token Strategy

- **Access token** — short-lived JWT returned in the **response body**. Client stores it in memory and sends as `Authorization: Bearer <token>` on every request.

- **Refresh token** — long-lived JWT stored in an **httpOnly cookie** (inaccessible to JS). Sent automatically by the browser on every request to the same origin.

| Token        | Storage        | Lifetime | Sent via                        |
| ------------ | -------------- | -------- | --------------------------------|
| Access token | Client memory  | 1 hour   | `Authorization: Bearer` header  |
| Refresh token| httpOnly cookie| 7 days   | Cookie (automatic)              |

### Login / Register flow

```typescript
// auth.controller.ts — login handler
const { user, tokens } = await this.authService.login(req.body);

res.cookie("refreshToken", tokens.refreshToken, {
  httpOnly: true,                           // JS cannot access this cookie
  secure: config.env === "production",      // HTTPS only in production
  maxAge: 7 * 24 * 60 * 60 * 1000,         // 7 days in ms
});

sendSuccess(res, { accessToken: tokens.accessToken, user }, "Login successful");
```

> **Response body** contains only the `accessToken`. The `refreshToken` is silently stored as an httpOnly cookie.

### Refresh token flow

```typescript
// auth.controller.ts — handleRefreshToken handler
const refreshToken = req.cookies?.["refreshToken"]; // populated by cookie-parser
if (!refreshToken) return next(new AppError("No refresh token", 401));

const { user, tokens } = await this.authService.refreshTokens(refreshToken);

res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true, ... }); // rotate
sendSuccess(res, { accessToken: tokens.accessToken, user }, "Token refreshed");
```

### Logout

```typescript
res.clearCookie("refreshToken");
```

### Required middleware in `app.ts`

```typescript
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
// credentials:true  → browser accepts Set-Cookie from cross-origin responses

app.use(cookieParser());
// Parses Cookie header → populates req.cookies (required before any route that reads cookies)
```

---

## Middlewares

### `auth.middleware.ts` — `protect` + `restrictTo`

```typescript
import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";

import appConfig from "../config/env.config";

import { AppError } from "../utils/app-error.util";

import User, { IUser } from "../modules/user/models/user.model";

import { UserRole } from "../modules/user/user.entity";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Verify Bearer token, load user from DB, attach to req.user

export const protect = async (
  req: AuthenticatedRequest,

  res: Response,

  next: NextFunction,
) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(new AppError("Not logged in", 401));

  try {
    const decoded = jwt.verify(token, appConfig.jwt.accessSecret) as any;

    const user = await User.findById(decoded.id);

    if (!user) return next(new AppError("User no longer exists", 401));

    req.user = user;

    next();
  } catch {
    return next(new AppError("Invalid token", 401));
  }
};

// Only allow specified roles

export const restrictTo = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Permission denied", 403));
    }

    next();
  };
};
```

### `error.middleware.ts` — Global error handler

```typescript
export const globalErrorHandler = (
  err: any,

  req: Request,

  res: Response,

  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;

  err.status = err.status || "error";

  if (appConfig.env === "development") {
    // Dev: full error + stack trace

    res.status(err.statusCode).json({
      status: err.status,

      error: err,

      message: err.message,

      stack: err.stack,
    });
  } else {
    // Prod: safe message for operational errors, generic for unknown

    if (err.isOperational) {
      res

        .status(err.statusCode)

        .json({ status: err.status, message: err.message });
    } else {
      console.error("ERROR 💥", err);

      res

        .status(500)

        .json({ status: "error", message: "Something went very wrong!" });
    }
  }
};
```

### `validate-request.middleware.ts` — Runs express-validator

```typescript
import { validationResult } from "express-validator";

export const validateRequest = (
  req: Request,

  res: Response,

  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors

      .array()

      .map((e) => e.msg)

      .join(", ");

    return next(new AppError(messages, 400));
  }

  next();
};
```

---

## Seeding Setup

### Architecture

```

scripts/

├── seed.ts                     # Master orchestrator — runs all seeders in order

└── seeding/

    ├── templates.ts            # Static reference data (departments, designations)

    ├── super-admin.seeder.ts   # Super admin (standalone-capable)

    ├── employee.seeder.ts      # Employee users

    ├── department.seeder.ts    # Departments with assigned users

    ├── job.seeder.ts           # Jobs linked to departments

    └── applicant.seeder.ts     # Applicant users + profiles

```

### Design Principles

| Principle           | How it's applied                                                            |

| ------------------- | --------------------------------------------------------------------------- |

| **Orchestration**   | `seed.ts` runs all seeders in dependency order                              |

| **Reusability**     | Each seeder is a standalone function that receives a repository             |

| **ORM-agnostic**    | Seeders use `MongooseRepository<T>` — same interface as services            |

| **Standalone mode** | Individual seeders use `require.main === module` guard for direct execution |

| **Realistic data**  | `@faker-js/faker` generates human-readable names, emails, etc.              |

| **Templates**       | Static reference data (department names, designations) in `templates.ts`    |

### `templates.ts` — Static reference data

```typescript
export const departmentTemplates = [
  {
    name: "Engineering",

    designations: [
      "Software Engineer",

      "Senior Software Engineer",

      "DevOps Engineer",

      "System Architect",
    ],
  },

  {
    name: "Product",

    designations: ["Product Manager", "Associate PM", "Product Owner"],
  }, // ... more departments
];
```

### Individual seeder pattern

Each seeder is a function that receives a repository (ORM-agnostic):

```typescript
// employee.seeder.ts

import { IUser } from "@/modules/user/models/user.model";

import { faker } from "@faker-js/faker";

import { UserRole } from "@/modules/user/user.entity";

import { MongooseRepository } from "@/utils/crud.util";

export const generateEmployees = async (
  count: number,

  userRepository: MongooseRepository<IUser>,

  hashedPassword: string,
) => {
  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();

    const lastName = faker.person.lastName();

    const user = await userRepository.create({
      name: `${firstName} ${lastName}`,

      email: faker.internet.email({ firstName, lastName }).toLowerCase(),

      password: hashedPassword,

      role: UserRole.EMPLOYEE,
    });

    users.push(user);
  }

  return users;
};
```

### Standalone seeder pattern

Seeders that need to run independently use the `require.main === module` guard:

```typescript
// super-admin.seeder.ts

export const generateSuperAdmin = async (
  userRepository: MongooseRepository<IUser>,
) => {
  const existing = await userRepository.findOne({
    email: appConfig.superAdmin.email,
  });

  if (!existing) {
    const admin = await userRepository.create({
      name: "Super Admin",

      email: appConfig.superAdmin.email,

      password: await bcrypt.hash(appConfig.superAdmin.password, 12),

      role: UserRole.SUPER_ADMIN,
    });

    console.log("✅ Super admin created");

    return admin;
  }

  console.log("ℹ️ Super admin already exists");

  return existing;
};

// Run directly: npm run seedAdmin

if (require.main === module) {
  (async () => {
    await connectToDatabase();

    const repo = new MongooseRepository<IUser>(User);

    await generateSuperAdmin(repo);

    process.exit(0);
  })();
}
```

### `seed.ts` — Master orchestrator

```typescript
import "dotenv/config";

import connectToDatabase from "../config/db.config";

import { MongooseRepository } from "../utils/crud.util";

import bcrypt from "bcrypt";

// ... import models, templates, and seeders

const seedData = async () => {
  try {
    await connectToDatabase(); // 1. Create repositories

    const deptRepo = new MongooseRepository<IDepartment>(DepartmentModel);

    const jobRepo = new MongooseRepository<IJob>(JobModel);

    const userRepo = new MongooseRepository<IUser>(User); // 2. Clear existing data

    await deptRepo.deleteMany({});

    await jobRepo.deleteMany({});

    await userRepo.deleteMany({}); // 3. Seed in dependency order

    const hashedPw = await bcrypt.hash("password123", 10);

    await generateSuperAdmin(userRepo);

    for (const template of departmentTemplates) {
      const users = await generateEmployees(30, userRepo, hashedPw);

      const dept = await generateDepartment(template, users, deptRepo);

      await generateJobs(10, dept, jobRepo);
    }

    await generateApplicants(20, userRepo, hashedPw);

    console.log("✅ Seeding complete!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);

    process.exit(1);
  }
};

seedData();
```

**Run:** `npm run seedData`

### Adding a new seeder

1. Create `scripts/seeding/<module>.seeder.ts`

2. Export a generator function that accepts a repository

3. Import and call it in `seed.ts`

4. (Optional) Add `require.main === module` block + npm script

---

## Wiring a New Module (Checklist)

### Step 1: Create module folder

```bash

mkdir src/modules/products

```

### Step 2: Create files (in this order)

| #   | File                    | What to do                                                                       |

| --- | ----------------------- | -------------------------------------------------------------------------------- |

| 1   | `product.entity.ts`     | Define interfaces and enums (no library imports)                                 |

| 2   | `product.dto.ts`        | `CreateProductDto` (required `!:`) + `UpdateProductDto` (optional `?:`)          |

| 3   | `product.model.ts`      | `IProduct` interface extending `Document`, Mongoose schema, model export         |

| 4   | `product.service.ts`    | Class with `MongooseRepository<IProduct>`, CRUD + business logic                 |

| 5   | `product.controller.ts` | Class that instantiates service, `async` handlers with `try/catch → next(error)` |

| 6   | `product.validator.ts`  | `express-validator` chains for create and update                                 |

| 7   | `product.route.ts`      | Wire `Router()`, apply `protect`/`restrictTo`, validators, `.bind(controller)`   |

### Step 3: Register in versioned routes

```typescript
// routes/v1.route.ts

import productRoutes from "@/modules/products/product.route";

router.use("/products", productRoutes);
```

### Step 4: (Optional) Add seeder

```typescript

// scripts/seeding/product.seeder.ts

export const generateProducts = async (count: number, repo: MongooseRepository<IProduct>) => { ... };

```

Import in `seed.ts`:

```typescript
import { generateProducts } from "./seeding/product.seeder";

await generateProducts(50, productRepo);
```

### Step 5: Done

Module is live at `GET /api/v1/products`, `POST /api/v1/products`, etc.

---

## Request Flow

```

Client Request

     │

     ▼

  app.ts

     │── express.json()           ← Parse body

     │── cors()                   ← CORS headers

     │── /api-docs                ← Swagger UI

     │

     ▼

  routes/v1.route.ts

     │── /health → direct response

     │── /auth   → auth module

     │── /departments → departments module

     │

     ▼

  Module Route (<module>.route.ts)

     │── protect            (verify JWT, load user from DB)

     │── restrictTo         (check user.role against allowed roles)

     │── validator chains   (express-validator rules)

     │── validateRequest    (collect errors, throw AppError if any)

     │── controller method  (class instance, .bind())

     │       │── calls service method (class instance)

     │       │       │── calls IBaseRepository methods

     │       │       │── throws AppError on failure

     │       │── sends JSON response

     │

     ▼ (on error)

  globalErrorHandler

     │── dev: full error + stack

     │── prod: safe message only

```

---

## Class Dependency Graph

```

Route File

  ├── instantiates Controller (class)

  │     └── instantiates Service (class)

  │           └── instantiates MongooseRepository (class)

  │                 └── wraps Mongoose Model

  └── applies Middleware functions

        ├── protect        (JWT → req.user)

        ├── restrictTo     (role check)

        └── validateRequest (express-validator)

```

**Auth module** — service-to-service dependency injection:

```

auth.route.ts

  ├── instantiates UserService (class)

  ├── instantiates AuthService (class, receives UserService in constructor)

  └── instantiates AuthController (class, receives AuthService in constructor)

```
