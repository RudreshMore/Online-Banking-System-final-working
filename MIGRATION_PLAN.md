# ONLINE BANKING SYSTEM: MIGRATION PLAN
## Spring Boot / Java / Thymeleaf → React + Node.js + Express + TypeScript + Prisma + MySQL

---

## 1. Executive Summary

This document establishes the end-to-end migration strategy for the **Online Banking System (SecureBank)** from its legacy monolithic Spring Boot 3 / Thymeleaf architecture to a modern, scalable, full-stack TypeScript application:
- **Frontend**: React 18 / 19 + TypeScript + Vite + React Router + Axios + Zod + Bootstrap 5 / Modern CSS
- **Backend**: Node.js + Express.js + TypeScript + Zod + JWT + bcryptjs + Helmet + CORS + Rate Limiter
- **Database / ORM**: MySQL + Prisma ORM (with `Decimal(15, 2)` precision for banking transactions and atomic transactions)
- **Quality & Testing**: Vitest, Supertest, Postman Collection

The primary objective is a **Technology Migration**, preserving 100% of existing functionality, banking business rules, user workflows, and UI/UX styling without introducing breaking changes or unintended features.

---

## 2. Existing Project Inspection & Analysis

### 2.1 Backend Architecture
- **Framework**: Spring Boot 3.5.9 (Java 17, Maven)
- **Data Access**: Spring Data JPA / Hibernate (`spring.jpa.hibernate.ddl-auto=update`)
- **Security**: Spring Security 6 with `DaoAuthenticationProvider`, `BCryptPasswordEncoder`, and session-based form login.
- **Package Structure**:
  - `com.bank.entity`: `User`, `Account`, `Transaction`
  - `com.bank.repository`: `UserRepository`, `AccountRepository`, `TransactionRepository`
  - `com.bank.service`: `UserService`, `AccountService`, `TransactionService`, `TransferService`
  - `com.bank.service.impl`: Implementation classes and `CustomUserDetailsService`
  - `com.bank.controller`: `HomeController`, `AuthController`, `DashboardController`, `TransactionController`, `TransferController`, `AdminController`, `AdminTransactionController`
  - `com.bank.config`: `SecurityConfig`, `DataInitializer` (admin auto-seeding)
  - `com.bank.exception`: `GlobalExceptionHandler`, `InsufficientBalanceException`, `ResourceNotFoundException`

### 2.2 Database Entities & Relationships
- **Database**: MySQL (`jdbc:mysql://localhost:3306/bankdb5`)
- **Entities**:
  1. **User (`users`)**:
     - `id`: Long (Primary Key, Auto-Increment)
     - `name`: String (NOT NULL)
     - `email`: String (NOT NULL, UNIQUE)
     - `mobileNumber` (`mobile_number`): String(10) (NOT NULL)
     - `password`: String (NOT NULL, BCrypt encrypted)
     - `role`: String (NOT NULL, values: `ROLE_ADMIN`, `ROLE_USER`)
     - `active`: boolean (NOT NULL, default: `true`)
     - Relation: `OneToOne` with `Account` (mappedBy = "user")
  2. **Account (`accounts`)**:
     - `id`: Long (Primary Key, Auto-Increment)
     - `accountNumber`: String (NOT NULL, UNIQUE, format: `"AC" + timestamp`)
     - `balance`: double (initial opening balance: `1000.0`)
     - `user_id`: Long (Foreign Key → `users.id`, NOT NULL, UNIQUE)
  3. **Transaction (`transactions`)**:
     - `id`: Long (Primary Key, Auto-Increment)
     - `fromAccount`: String (nullable; null / "BANK" for admin deposit, or sender account number)
     - `toAccount`: String (receiver account number)
     - `amount`: double
     - `type`: String (`DEBIT`, `CREDIT`, `ADMIN_DEPOSIT`)
     - `transactionDate`: LocalDateTime (NOT NULL)

### 2.3 Existing Frontend Technology & Pages
- **Technology**: Thymeleaf Server-Side Rendering (SSR) with Bootstrap 5.3.3, Google Fonts (Poppins & Segoe UI), AOS (Animate on Scroll) animations, Swiper Carousel, custom CSS (`style.css`), static images (`bank1.jpg`, `bank2.jpg`, `bank3.jpg`).
- **Templates / Screens**:
  1. `index.html` / `home.html`: Landing page with Hero section, Swiper carousel / bank illustration, "Why Choose SecureBank?" feature cards, services showcase, and footer.
  2. `about.html`: Information about the digital banking platform.
  3. `services.html`: Overview of banking services (Online Money Transfer, Account Management, Transaction History, Admin Banking Control).
  4. `contact.html`: Contact details (Email, Phone).
  5. `help.html`: Customer support guidance.
  6. `login.html`: Branded login card (Email & Password), alerts for invalid credentials, account blocked (`param.blocked`), and successful logout.
  7. `register.html`: Registration form (Full Name, Mobile Number [10 digits pattern], Email, Password).
  8. `dashboard.html`: User dashboard displaying welcome message, live Account Balance (₹), Account Number, Account Status (Active/Blocked), quick actions (Transfer Money, View Transactions, Profile), and security advisory.
  9. `profile.html`: User profile overview with avatar initials, Name, Email, Mobile, Account Number, Balance, and Status badge.
  10. `transfer.html`: Transfer money form with sender account (read-only), receiver account number, transfer amount (min 1), with error/success alerts.
  11. `transactions.html`: User transaction history table displaying Type (Credit/Debit/Admin badges), From, To, Amount (₹), and Date & Time formatted as `dd-MM-yyyy HH:mm`.
  12. `admin-dashboard.html`: Admin portal with total registered users counter, users table displaying Name, Email, Account No, Balance, Status, inline Deposit form (`amount` input + Deposit button), view user transactions link, and block/unblock toggle.
  13. `admin-transactions.html`: Global transaction log or user-specific transaction log with transaction types, descriptions, and account details.
  14. `admin-deposit.html` / `fragments/admin-deposit.html`: Standalone deposit form page.
  15. `error.html`: User-friendly error page with return to dashboard button.

### 2.4 Existing APIs & Route Mappings
| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/` or `/home` | GET | Public | Home landing page |
| `/about` | GET | Public | About page |
| `/services` | GET | Public | Services page |
| `/contact` | GET | Public | Contact page |
| `/help` | GET | Public | Help page |
| `/login` | GET / POST | Public | Form login (redirects to `/admin/dashboard` or `/dashboard`) |
| `/register` | GET / POST | Public | User registration + immediate auto-creation of account (1000 balance) |
| `/logout` | POST | Authenticated | Logout session |
| `/dashboard` | GET | ROLE_USER | User dashboard (redirects ROLE_ADMIN to `/admin/dashboard`) |
| `/profile` | GET | Authenticated | User profile details |
| `/transfer` | GET / POST | ROLE_USER | Money transfer between accounts |
| `/transactions` | GET | ROLE_USER | User transaction history |
| `/admin/dashboard` | GET | ROLE_ADMIN | Admin overview of all users and inline actions |
| `/admin/toggle/{id}`| GET | ROLE_ADMIN | Toggles user active status (`true` <-> `false`) |
| `/admin/deposit` | POST | ROLE_ADMIN | Admin funds injection into user account |
| `/admin/transactions` | GET | ROLE_ADMIN | View all transactions system-wide |
| `/admin/transactions/{userId}` | GET | ROLE_ADMIN | View transactions for specific user account |

### 2.5 Banking Business Logic & Invariants
1. **Admin Seeding**: On application boot (`DataInitializer`), if `admin@bank.com` does not exist, system seeds `admin@bank.com` with password `admin123`, role `ROLE_ADMIN`, active `true`, and creates an account for the admin.
2. **Account Creation**: Upon successful registration, an account is automatically generated:
   - Account number: `"AC" + Date.now()`
   - Initial opening balance: `1000.0`
3. **Money Transfer Business Rules**:
   - `amount > 0` (otherwise error: "Invalid transfer amount")
   - `fromAccount !== toAccount` (otherwise error: "Sender and receiver cannot be same")
   - Sender account must exist (otherwise error: "Sender account not found")
   - Receiver account must exist (otherwise error: "Receiver account not found")
   - Sender balance must be `>= amount` (otherwise error: "Insufficient balance")
   - Balances updated atomically: `sender.balance -= amount`, `receiver.balance += amount`
   - Two transaction records generated:
     - Record 1: Type `DEBIT`, from: `fromAccount`, to: `toAccount`, amount: `amount`
     - Record 2: Type `CREDIT`, from: `fromAccount`, to: `toAccount`, amount: `amount`
4. **Admin Deposit Business Rules**:
   - `amount > 0` (otherwise error: "Amount must be greater than zero")
   - Target account retrieved via `userId`
   - Balance updated: `account.balance += amount`
   - One transaction record generated: Type `ADMIN_DEPOSIT`, from: `"BANK"`, to: `account.accountNumber`, amount: `amount`
5. **Account Status Control**:
   - Admin can toggle `active` flag on users.
   - If `active === false`, login must be denied with message: "🔒 Your account has been blocked by admin. Please contact support."

---

## 3. Target Architecture & Technology Stack

```
Online Banking System (Migrated)
│
├── frontend/                     (React 18/19 + TypeScript + Vite)
│   ├── src/
│   │   ├── assets/               (images, logo, styling)
│   │   ├── components/           (Navbar, Footer, Alert, ProtectedRoute, RoleRoute, StatCard)
│   │   ├── context/              (AuthContext: login, logout, user, token, role)
│   │   ├── hooks/                (useAuth, useAccounts, useTransactions)
│   │   ├── pages/                (Home, About, Services, Contact, Help, Login, Register,
│   │   │                          Dashboard, Profile, Transfer, Transactions,
│   │   │                          AdminDashboard, AdminTransactions, NotFound)
│   │   ├── services/             (api.ts, auth.service.ts, account.service.ts,
│   │   │                          transaction.service.ts, admin.service.ts)
│   │   ├── schemas/              (auth.schema.ts, transfer.schema.ts, deposit.schema.ts)
│   │   ├── types/                (user.types.ts, account.types.ts, transaction.types.ts, api.types.ts)
│   │   ├── utils/                (currency.ts, date.ts)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/               (env.ts, db.ts, seed.ts)
│   │   ├── errors/               (AppError.ts, error-codes.ts)
│   │   ├── middleware/           (auth.middleware.ts, role.middleware.ts,
│   │   │                          validate.middleware.ts, error.middleware.ts,
│   │   │                          rateLimiter.middleware.ts)
│   │   ├── modules/
│   │   │   ├── auth/             (auth.controller.ts, auth.service.ts, auth.routes.ts, auth.validation.ts)
│   │   │   ├── users/            (user.controller.ts, user.service.ts, user.routes.ts, user.validation.ts)
│   │   │   ├── accounts/         (account.controller.ts, account.service.ts, account.routes.ts, account.validation.ts)
│   │   │   ├── transactions/     (transaction.controller.ts, transaction.service.ts, transaction.routes.ts, transaction.validation.ts)
│   │   │   └── admin/            (admin.controller.ts, admin.service.ts, admin.routes.ts, admin.validation.ts)
│   │   ├── routes/               (index.ts: aggregates all module routers under /api)
│   │   ├── types/                (express.d.ts, common.types.ts)
│   │   ├── utils/                (jwt.ts, password.ts, logger.ts, response.ts)
│   │   ├── app.ts                (express app setup: helmet, cors, json, routes, errorHandler)
│   │   └── server.ts             (server entry point: DB check, admin seed check, listen on PORT)
│   ├── prisma/
│   │   ├── schema.prisma         (User, Account, Transaction models with Decimal types)
│   │   └── seed.ts               (Admin default seeder)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── original/                     (Preserved original Spring Boot project untouched)
```

---

## 4. Spring Boot → Node.js / Express / TypeScript Mapping

| Spring Boot Component | Node.js / Express / TypeScript Target |
|---|---|
| `OnlineBankingSystemApplication.java` | `backend/src/server.ts` & `backend/src/app.ts` |
| `SecurityConfig.java` | `middleware/auth.middleware.ts`, `middleware/role.middleware.ts`, `helmet`, `cors` |
| `DataInitializer.java` | `backend/src/config/seed.ts` (executed during startup / prisma seed) |
| `User.java`, `Account.java`, `Transaction.java` | `backend/prisma/schema.prisma` (`User`, `Account`, `Transaction` models) |
| `UserRepository.java` | `prisma.user.*` calls inside services |
| `AccountRepository.java` | `prisma.account.*` calls inside services |
| `TransactionRepository.java` | `prisma.transaction.*` calls inside services |
| `UserServiceImpl.java` | `backend/src/modules/users/user.service.ts` |
| `AccountServiceImpl.java` | `backend/src/modules/accounts/account.service.ts` |
| `TransferServiceImpl.java` | `backend/src/modules/transactions/transaction.service.ts` (using `prisma.$transaction`) |
| `TransactionServiceImpl.java` | `backend/src/modules/transactions/transaction.service.ts` |
| `AuthController.java` | `backend/src/modules/auth/auth.controller.ts` & `auth.routes.ts` |
| `DashboardController.java` | `backend/src/modules/users/user.controller.ts` & `account.controller.ts` |
| `TransferController.java` | `backend/src/modules/transactions/transaction.controller.ts` |
| `TransactionController.java` | `backend/src/modules/transactions/transaction.controller.ts` |
| `AdminController.java` & `AdminTransactionController.java` | `backend/src/modules/admin/admin.controller.ts` & `admin.routes.ts` |
| `GlobalExceptionHandler.java` | `backend/src/middleware/error.middleware.ts` + `backend/src/errors/AppError.ts` |
| `application.properties` | `backend/.env` + `backend/src/config/env.ts` |

---

## 5. Existing Frontend → React / TypeScript Mapping

| Thymeleaf View | React Route | Component / Page | Key Features Preserved |
|---|---|---|---|
| `home.html` / `index.html` | `/` | `pages/Home.tsx` | Hero, Banking graphic, "Why Choose SecureBank?", Services, Footer, Navigation |
| `about.html` | `/about` | `pages/About.tsx` | About SecureBank digital platform overview |
| `services.html` | `/services` | `pages/Services.tsx` | List of digital banking services |
| `contact.html` | `/contact` | `pages/Contact.tsx` | Contact info (phone, email, author Rudresh Narayan More) |
| `help.html` | `/help` | `pages/Help.tsx` | Customer support info |
| `login.html` | `/login` | `pages/Login.tsx` | Poppins font, dark slate gradient card, email & password inputs, blocked alert, logout message |
| `register.html` | `/register` | `pages/Register.tsx` | Name, 10-digit mobile, email, password, instant feedback, redirect to login |
| `dashboard.html` | `/dashboard` | `pages/Dashboard.tsx` | Welcome user, Balance card, Account number card, Status card, Quick Action buttons, Security notice |
| `profile.html` | `/profile` | `pages/Profile.tsx` | Avatar initial, Name, Email, Mobile, Account Number, Balance, Status badge |
| `transfer.html` | `/transfer` | `pages/Transfer.tsx` | Read-only from account, recipient account input, amount input, live balance check, error/success banners |
| `transactions.html` | `/transactions` | `pages/Transactions.tsx` | Transaction list, type badges (CREDIT: green, DEBIT: red, ADMIN: blue), amount, formatted date |
| `admin-dashboard.html` | `/admin/dashboard` | `pages/AdminDashboard.tsx` | Total users counter card, all users table, inline deposit amount + button, Block/Unblock toggle, view transactions link |
| `admin-transactions.html` | `/admin/transactions` & `/admin/transactions/:userId` | `pages/AdminTransactions.tsx` | Global & user-specific transactions, badges, sender/receiver, timestamps |
| `error.html` | `*` | `pages/NotFound.tsx` & `components/ErrorBoundary.tsx` | Oops error banner with back to dashboard button |

---

## 6. REST API Design (Old Spring Endpoints → New Express APIs)

All Express API endpoints will return a standardized response format:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```
And on error:
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | INSUFFICIENT_FUNDS | NOT_FOUND | INTERNAL_ERROR"
}
```

### API Mapping Table:
| Old Spring Endpoint | New Express Endpoint | Method | Auth | Body / Query | Description |
|---|---|---|---|---|---|
| `POST /register` | `/api/auth/register` | POST | None | `{ name, email, mobileNumber, password }` | Register user + auto-create account (1000 balance) |
| `POST /login` | `/api/auth/login` | POST | None | `{ email, password }` | Returns JWT token + user object + redirect role |
| `GET /dashboard` | `/api/users/me` & `/api/accounts/me` | GET | USER/ADMIN | Headers: `Bearer <token>` | Fetches authenticated user info and account details |
| `GET /profile` | `/api/users/me` | GET | USER/ADMIN | Headers: `Bearer <token>` | Fetches profile info |
| `POST /transfer` | `/api/transactions/transfer` | POST | USER | `{ toAccount, amount }` | Performs atomic transfer from caller's account to recipient |
| `GET /transactions`| `/api/transactions/my` | GET | USER | Headers: `Bearer <token>` | Returns caller's transactions |
| `GET /admin/dashboard`| `/api/admin/users` | GET | ADMIN | Headers: `Bearer <token>` | Returns list of all users with accounts |
| `GET /admin/toggle/{id}`| `/api/admin/users/:id/toggle` | PATCH | ADMIN | Headers: `Bearer <token>` | Toggles user active status |
| `POST /admin/deposit` | `/api/admin/deposit` | POST | ADMIN | `{ userId, amount }` | Deposits money into user account |
| `GET /admin/transactions`| `/api/admin/transactions` | GET | ADMIN | Headers: `Bearer <token>` | Gets all system transactions |
| `GET /admin/transactions/{userId}`| `/api/admin/transactions/user/:userId` | GET | ADMIN | Headers: `Bearer <token>` | Gets transactions for specific user |

---

## 7. Migration Risks & Mitigation Strategies

1. **Floating-point rounding errors in financial transactions**:
   - *Risk*: JavaScript `Number` introduces IEEE 754 floating-point inaccuracies (e.g., `0.1 + 0.2 !== 0.3`).
   - *Mitigation*: Use MySQL `DECIMAL(15, 2)` and Prisma's `Decimal` type (backed by `decimal.js`). Avoid JS raw float math.
2. **Race conditions during concurrent transfers**:
   - *Risk*: Double-spending if balance is checked and updated non-atomically.
   - *Mitigation*: Wrap sender balance check, debit, credit, and transaction record creation inside an interactive `prisma.$transaction()`.
3. **Session vs. JWT Auth State**:
   - *Risk*: Spring Security used server-side cookie sessions. React needs JWT tokens.
   - *Mitigation*: Issue signed JWT with `userId`, `email`, and `role`. Store securely, auto-attach in Axios interceptor, check expiration, and auto-logout on 401.
4. **Preserving Original Source Code**:
   - *Risk*: Overwriting existing files in workspace.
   - *Mitigation*: Move Spring Boot project to `original/` (or keep untouched) while building `frontend/` and `backend/` in dedicated subdirectories.

---

## 8. Migration Phases & Step-by-Step Order

- [x] **PHASE 1**: Complete project inspection (Completed)
- [x] **PHASE 2**: Create `MIGRATION_PLAN.md` & obtain user approval (Current Step)
- [ ] **PHASE 3**: Set up React + TypeScript + Vite frontend (`frontend/`)
- [ ] **PHASE 4**: Set up Node.js + Express + TypeScript backend (`backend/`)
- [ ] **PHASE 5**: Create Prisma schema (`schema.prisma`), migrations, and MySQL integration
- [ ] **PHASE 6**: Migrate authentication (Register, Login, JWT, bcrypt, Auth middleware)
- [ ] **PHASE 7**: Migrate user and core modules (Profile, Admin user management, Block/Unblock toggle)
- [ ] **PHASE 8**: Migrate banking/account functionality (Account retrieval, Admin deposit)
- [ ] **PHASE 9**: Migrate transactions and financial business logic (Transfer money with atomic transaction, history logs)
- [ ] **PHASE 10**: Connect React frontend to Node.js APIs (Axios service layer, Context, Pages, UI components)
- [ ] **PHASE 11**: Test complete application (Unit/Integration tests, API flow verification, End-to-end tests)
- [ ] **PHASE 12**: Verification, Postman collection documentation, and final comparison with original application.
