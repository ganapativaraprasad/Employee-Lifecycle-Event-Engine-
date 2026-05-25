import {
  Routes,
  Route,
  Navigate
} from "react-router-dom"

import MainLayout from "./layouts/MainLayout"

import DashboardPage from "./pages/DashboardPage"
import EmployeesPage from "./pages/EmployeesPage"
import LoginPage from "./pages/LoginPage"
import OnboardingPage from "./pages/OnboardingPage"
import RegisterPage from "./pages/RegisterPage"

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
          path="/register"
          element={<RegisterPage />}
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
          element={<DashboardPage />}
        />

        <Route
          path="/employees"
          element={<EmployeesPage />}
        />

        <Route
          path="/onboarding"
          element={<OnboardingPage />}
        />

        <Route
          path="/register"
          element={<Navigate to="/dashboard" />}
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