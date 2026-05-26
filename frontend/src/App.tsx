import {
  Routes,
  Route,
  Navigate
} from "react-router-dom"

import MainLayout from "./layouts/MainLayout"
import ProtectedRoute from "./routes/ProtectedRoute"

import DashboardPage from "./pages/DashboardPage"
import EmployeesPage from "./pages/EmployeesPage"
import LeavePage from "./pages/LeavePage"
import CalendarPage from "./pages/CalendarPage"
import LoginPage from "./pages/LoginPage"
import UsersPage from "./pages/UsersPage"
import ProfilePage from "./pages/ProfilePage"
import ChangePasswordPage from "./pages/ChangePasswordPage"

function App() {

  const token = localStorage.getItem(
    "access_token"
  )

  // If user not logged in

  if (!token) {

    return (

      <Routes>

        <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>
    )
  }

  // If logged in

  return (

    <MainLayout>

      <Routes>

        <Route
          path="/"
          element={<Navigate to="/dashboard" />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "HR_MANAGER"]}
            >
              <EmployeesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "HR_MANAGER", "EMPLOYEE"]}
            >
              <CalendarPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaves"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "HR_MANAGER", "EMPLOYEE"]}
            >
              <LeavePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "HR_MANAGER"]}
            >
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" />}
        />

      </Routes>

    </MainLayout>
  )
}

export default App