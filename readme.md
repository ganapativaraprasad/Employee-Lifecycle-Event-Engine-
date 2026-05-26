# Employee Lifecycle Event Engine

Full-stack HRMS to manage employees, leave requests, and lifecycle transitions. The backend is FastAPI + Beanie (MongoDB), and the frontend is React + Vite + Tailwind.

## Features

- Employee lifecycle management with FSM transitions
- Leave management for employees, HR, and admin
- Dashboard with department distribution and recent activity
- User management for admins (create HR and employee accounts)
- WebSocket notifications and audit logging

## Tech Stack

**Backend**
- FastAPI
- Beanie (MongoDB)
- Pydantic
- aiosmtplib (email)

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS

## Project Structure

```
app/                # FastAPI backend
frontend/           # React frontend
alembic/            # DB migrations (if used)
tests/              # Tests
uploads/            # Uploaded files
requirements.txt    # Backend dependencies
```

## Backend Setup

1. Create a virtual environment and install dependencies:

	```bash
	python -m venv venv
	venv\Scripts\activate
	pip install -r requirements.txt
	```

2. Create a `.env` file in the project root:

	```ini
	mongodb_url=mongodb://localhost:27017
	database_name=employee_lifecycle
	jwt_secret_key=your-secret-key
	smtp_email=your-email@gmail.com
	smtp_password=your-app-password
	```

3. Start the API server:

	```bash
	uvicorn app.main:app --reload --port 8000
	```

The API will be available at `http://localhost:8000`.

## Frontend Setup

1. Install dependencies:

	```bash
	cd frontend
	npm install
	```

2. Start the dev server:

	```bash
	npm run dev
	```

The app will be available at `http://localhost:5173`.

## Notes

- Email notifications require valid SMTP credentials (use a Gmail app password).
- CORS is configured for `http://localhost:5173` in the backend.

