import { useState } from "react"

import { loginUser } from "../services/authService"
import InlineNotice from "../components/InlineNotice"

function LoginPage() {

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")

  const handleLogin = async () => {

    try {

      setLoading(true)

      setError("")

      const data = await loginUser(
        email,
        password
      )

      console.log(data)

      localStorage.setItem(
        "access_token",
        data.access_token
      )

      localStorage.setItem(
        "user_role",
        data.user.role
      )

      localStorage.setItem(
        "username",
        data.user.username
      )

      localStorage.setItem(
        "user_email",
        data.user.email
      )

      window.location.href = "/"

    } catch (error: any) {

      console.log(error)

      setError(
        "Invalid Credentials"
      )

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 via-white to-indigo-100 px-4 animate-fade-in">

      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">

        {/* Logo */}

        <div className="text-center mb-8">

          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-lg">

            H

          </div>

          <h1 className="text-4xl font-bold text-gray-800 mt-5">

            HRMS

          </h1>

          <p className="text-gray-500 mt-3 text-base">

            Employee Lifecycle Engine

          </p>

        </div>

        <InlineNotice message={error} variant="error" />

        {/* Email */}

        <div className="mb-5">

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Email

          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />

        </div>

        {/* Password */}

        <div className="mb-6">

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Password

          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />

        </div>

        {/* Login Button */}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition text-base font-semibold shadow-md disabled:bg-blue-300"
        >

          {

            loading
              ? "Logging in..."
              : "Login"
          }

        </button>

      </div>

    </div>
  )
}

export default LoginPage