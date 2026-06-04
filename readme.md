# Employee Lifecycle Event Engine

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136.1-teal)
![MongoDB](https://img.shields.io/badge/MongoDB-Beanie%20ODM-green)
![React](https://img.shields.io/badge/React-19.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue)

Production-ready HR workflow platform that manages employee lifecycle transitions, leave workflows, holiday calendars, and dashboard analytics. The backend exposes a secured FastAPI API with asynchronous event processing and audit logging, while the frontend provides role-aware HR and employee experiences.

# Overview

This system centralizes HR operations across the employee journey. It solves the business problem of tracking employee state transitions, managing leave requests, and providing operational visibility with audit trails and notifications. Role-based access control ensures administrators, HR managers, and employees only access the workflows they are authorized to perform.

# Features

- Employee Lifecycle Management with a finite state machine (FSM)
- FSM workflow validation and controlled state transitions
- JWT Authentication with access and refresh tokens
- Role Based Access Control (RBAC) for Admin, HR Manager, and Employee
- Employee Management: create, update, soft delete, search, filter, paginate
- Employee document upload and download
- Leave Management: apply, approve/reject, stats, and calendar view
- Calendar & Holiday Management with seed data for 2026
- Dashboard Analytics: counts by state, department distribution, recent activity
- Audit Logging for employee lifecycle transitions
- Email Notifications for status changes, welcome messages, and password reset
- WebSocket Notifications for real-time employee state updates
- Event Queue Processing with background worker
- Password Reset Functionality with reset codes and expiry

# FSM Workflow

**Employee States**

- HIRED
- ONBOARDING
- ACTIVE
- ON_LEAVE
- TRANSFERRED
- SUSPENDED
- OFFBOARDED

**Allowed Transitions**

| From | To |
| --- | --- |
| HIRED | ONBOARDING |
| ONBOARDING | ACTIVE |
| ACTIVE | ON_LEAVE, TRANSFERRED, SUSPENDED, OFFBOARDED |
| ON_LEAVE | ACTIVE, OFFBOARDED |
| TRANSFERRED | ACTIVE |
| SUSPENDED | ACTIVE, OFFBOARDED |
| OFFBOARDED | ACTIVE |

# Role Based Access Control

| Capability | Admin | HR Manager | Employee |
| --- | --- | --- | --- |
| Login and refresh token | Yes | Yes | Yes |
| View dashboard stats | Yes | Yes | Yes |
| Create employee | Yes | Yes | No |
| Update employee | Yes | Yes | No |
| Soft delete employee | Yes | No | No |
| Transition employee state | Yes | Yes | No |
| Upload or download employee documents | Yes | Yes | No |
| Create users | Yes | HR can only create Employee users | No |
| List users | Yes | No | No |
| View or update own profile | Yes | Yes | Yes |
| Change own password | Yes | Yes | Yes |
| Forgot or reset password | Yes | Yes | Yes |
| Apply leave | Yes | Yes | Yes |
| Approve or reject leave | Yes | Yes (HR leave approval requires Admin) | No |
| Leave stats | Yes | Yes | No |
| List holidays | Yes | Yes | Yes |
| Create, update, delete holidays | Yes | Yes | No |
| List calendar events | Yes | Yes | Yes (filtered) |
| Create, update, delete events | Yes | Yes | Employees can manage personal events only |

# System Architecture

- **API Layer:** FastAPI with versioned routes under `/api/v1`
- **Auth Layer:** OAuth2 password flow with JWT access and refresh tokens
- **Data Layer:** MongoDB via Motor and Beanie ODM
- **Service Layer:** Transition logic, event publishing, notifications
- **Async Processing:** Background event worker started on application startup
- **Notifications:** Email and WebSocket broadcast messages
- **Frontend:** React + TypeScript with role-aware routing and API services

# Event Driven Architecture

```
Employee State Transition
   │
   ▼
 Publish Event
   │
   ▼
 Async Queue
   │
   ▼
 Background Worker
 ├── Email Notification
 ├── Audit Log Creation
 └── WebSocket Notification
```

The lifecycle transition acts as the producer, publishing an event into an in-memory async queue. A background worker consumes events and performs side effects (email, audit logging, and WebSocket broadcasts) asynchronously, keeping the API response fast while preserving reliable processing.

# Technology Stack

**Backend**

- FastAPI
- Beanie ODM
- MongoDB (Motor, PyMongo)
- Pydantic
- JWT (python-jose)
- Passlib (bcrypt)
- AsyncIO
- WebSockets (FastAPI)
- aiosmtplib

**Frontend**

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- React Icons
- Lucide React

# Project Structure

```
app/
  api/routes/          # REST endpoints (auth, users, employees, leaves, calendar, dashboard)
  core/                # Config, FSM, enums, security, RBAC dependencies
  exceptions/          # Custom exceptions and handlers
  models/              # Beanie document models
  queue/               # Async event queue
  schemas/             # Pydantic request/response schemas
  services/            # Business logic, notifications, event worker
  websocket/           # WebSocket connection manager
frontend/              # React + TypeScript client
alembic/               # Present in repo
tests/                 # Test artifacts excluded from repository
uploads/               # Employee document uploads
requirements.txt       # Backend dependencies
mypy.ini               # MyPy configuration
```

# API Documentation

FastAPI provides OpenAPI docs once the backend is running:

- Swagger UI: `http://127.0.0.1:8000/docs`
- Redoc: `http://127.0.0.1:8000/redoc`

# Installation

## Backend

```bash
git clone <your-repo-url>
cd employee-lifecycle-engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the repository root:

```ini
mongodb_url=
database_name=
jwt_secret_key=
smtp_email=
smtp_password=
```

Run the API server:

```bash
uvicorn app.main:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://127.0.0.1:8000/api/v1`.

# Environment Variables

The backend reads environment variables from `.env` using `pydantic_settings`:

```
mongodb_url=
database_name=
jwt_secret_key=
smtp_email=
smtp_password=
```

# Testing

- Automated FSM and RBAC validation was performed during development and Sprint 2.
- Test suites are intentionally excluded from the public repository.
- The current repository does not include test files.

Execution example used during development:

```
pytest
```

# Type Safety

Static type validation is implemented using MyPy across the application.

Validation command:

```
mypy app
```

Recent validation result:

```
Success: no issues found in 46 source files
```

Type checking has been applied across API routes, services, models, exception handlers, and core modules.

# Security Improvements

Implemented security hardening measures:

- JWT secret managed through environment variables
- SMTP credentials managed through environment variables
- `.env` excluded from source control
- `venv/` excluded from source control
- Sensitive files protected through `.gitignore`
- Repository cleaned to prevent accidental credential exposure

# Future Enhancements

- Add unit and integration tests for FSM, RBAC, and API flows
- Expand audit logging to cover create/update/delete actions
- Add refresh token revocation and session management
- Add targeted WebSocket channels instead of broadcast-only updates
- Add CI pipelines for linting, MyPy, and test automation

# Author

Maintained by the Employee Lifecycle Event Engine team.

