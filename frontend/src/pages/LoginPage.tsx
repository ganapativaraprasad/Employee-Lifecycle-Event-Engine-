import { useState } from "react"

import { Link } from "react-router-dom"

import { loginUser } from "../services/authService"

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

      alert("Login Successful 🚀")

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

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-4">

      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">

        {/* Logo */}

        <div className="text-center mb-8">

          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-lg">

            H

          </div>

          <h1 className="text-5xl font-bold text-gray-800 mt-5">

            HRMS

          </h1>

          <p className="text-gray-500 mt-3 text-lg">

            Employee Lifecycle Engine

          </p>

        </div>

        {/* Error */}

        {

          error && (

            <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-5 text-sm font-medium">

              {error}

            </div>
          )
        }

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
            className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg"
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
            className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />

        </div>

        {/* Login Button */}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition text-lg font-semibold shadow-md disabled:bg-blue-300"
        >

          {

            loading
              ? "Logging in..."
              : "Login"
          }

        </button>

        {/* Register */}

        <div className="text-center mt-6">

          <p className="text-gray-500">

            Don't have an account?

          </p>

          <Link
            to="/register"
            className="text-blue-600 font-semibold hover:text-blue-700"
          >

            Register Here

          </Link>

        </div>

      </div>

    </div>
  )
}

export default LoginPage