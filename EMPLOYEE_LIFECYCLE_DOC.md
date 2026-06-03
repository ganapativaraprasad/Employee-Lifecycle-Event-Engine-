# Employee Lifecycle Event Engine Documentation (1-11 Format)

1. Problem Statement

   Organizations need a system to manage employee lifecycle events (onboarding, active, on-leave, transfers, suspensions, offboarding), leave requests, user accounts, notifications and audit logs. The challenge is to provide reliable state transitions, accurate leave workflows, secure access controls, and real-time notifications while keeping the system maintainable and auditable.

2. Objective

- Build a backend-first HRMS engine that:
  - Manages employee lifecycle states and transitions
  - Supports leave application, approval, and calendar views
  - Provides user management and role-based access control
  - Sends notifications and maintains audit logs
- Ensure:
  - Robust state machine enforcement for transitions
  - Clear API design and schema contracts
  - Reasonable operational defaults for local development

3. Requirements

Functional Requirements:

- Accept CRUD operations for employees and users
- Accept leave applications and support approval/rejection
- Enforce allowed employee state transitions (FSM)
- Provide endpoints for downloads/uploads and calendar events
- Broadcast notifications via WebSocket and send emails

Non-Functional Requirements:

- Use JWT-based authentication and role checks
- Persist data in MongoDB via Beanie (async)
- Keep configuration via `.env` (secrets not committed)
- Provide reasonable input validation and error handling

4. Approach

1. Code Organization
   - Backend: FastAPI app in `app/` with routers under `app/api/routes/`.
   - Models: Beanie Document models under `app/models/`.
   - Schemas: Pydantic request/response models under `app/schemas/`.
   - Services: Business logic in `app/services/` (employee transitions, notifications).

2. FSM Enforcement
   - Centralized FSM rules in `app/core/fsm.py` with `is_transition_allowed()` function.
   - `EmployeeService.transition_employee()` applies transitions, records `AuditLog`, broadcasts events, and publishes to queue stub.

3. Auth & Roles
   - JWT tokens via `app/core/security.py` and dependencies in `app/core/dependencies.py`.
   - Role enforcement using `require_roles()` dependency.

4. Notifications & Events
   - Email sending via `app/services/notification_service.py` (aiosmtplib) gated by SMTP config.
   - WebSocket broadcasting via `app/websocket/manager.py`.
   - Event publishing via `app/queue/event_queue.py` (currently a console stub).

5. System Architecture

   Explanation:

   1. Input Layer
      - REST API endpoints exposed at `/api/v1/*` (see `app/main.py`).

   2. Processing Layer
      - Request validation via Pydantic schemas, business logic in services, database access via Beanie/Motor.

   3. Persistence
      - MongoDB collections for `users`, `employees`, `leave_requests`, `holidays`, `calendar_events`, `audit_logs`.

   4. Output & Integration
      - Responses to clients, WebSocket broadcasts, email notifications, and published events (stub).

6. Technologies Used

- Python 3.10+
- FastAPI
- Beanie + Motor (MongoDB, async)
- Pydantic
- python-jose (JWT), passlib (bcrypt)
- aiosmtplib (SMTP)
- React + TypeScript + Vite + Tailwind (frontend)

7. Results

- Backend exposes modular routers for authentication, users, employees, leaves, calendar, and dashboard.
- Employee FSM enforced in code; transitions create audit logs and publish events.
- File uploads supported (disk `uploads/`), with validation and size limits.
- WebSocket endpoint (`/ws`) for real-time broadcasts.

8. Key Findings

- FSM centralization simplifies transition validation and makes rules auditable.
- Using Beanie documents and indexes improves query efficiency for common filters (employee_code, email, department, current_state).
- Notification sending is conditional on SMTP configuration — safe for local development but requires setup in production.
- Event publishing is a stub and should be replaced with a real broker for distributed systems.

9. Limitations

- Event queue is a console stub (`app/queue/event_queue.py`) — no durable message bus currently.
- File uploads are stored on local disk — not suitable for multi-instance or cloud deployments.
- No automated role-permission matrix beyond `require_roles()` — granular ACLs may be required.
- Email delivery depends on SMTP credentials and has no retry/queueing.

10. Conclusion

   The Employee Lifecycle Event Engine provides a pragmatic, backend-centric HRMS foundation with clear separation of concerns: API routers, document models, FSM rules, services, and simple event/notification mechanisms. It is suitable for prototyping and small deployments but requires infrastructure upgrades (message broker, object storage, production SMTP) and hardened security for production use.

11. Future Improvements

- Replace `publish_event()` with a durable message broker (RabbitMQ, Kafka, or Azure Service Bus).
- Move file uploads to object storage (S3/Azure Blob) and secure access with presigned URLs.
- Implement background workers for email sending and retry logic (Celery, RQ, or FastAPI background workers with durable queues).
- Add integration tests and CI pipeline; add linting and type-checking.
- Expand role & permission model to fine-grained ACLs and audit more actions.
- Improve observability (structured logs, metrics, tracing) and production deployment manifests (Docker, k8s manifests).
