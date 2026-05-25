import { useState } from "react"

import { Link } from "react-router-dom"

import api from "../api/axios"

function RegisterPage() {

  const [username, setUsername] = useState("")

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [role, setRole] = useState("EMPLOYEE")

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")

  const handleRegister = async () => {

    try {

      setLoading(true)

      setError("")

      await api.post(

        "/auth/register",

        {
          username,
          email,
          password,
          role
        }
      )

      alert("Registration Successful 🚀")

      window.location.href = "/"

    } catch (error: any) {

      console.log(error)

      setError(
        error?.response?.data?.detail ||
        "Registration Failed"
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

        {/* Username */}

        <div className="mb-5">

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Username

          </label>

          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />

        </div>

        {/* Email */}

        <div className="mb-5">

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Email

          </label>

          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />

        </div>

        {/* Password */}

        <div className="mb-5">

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Password

          </label>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />

        </div>

        {/* Role */}

        <div className="mb-6">

          <label className="block text-sm font-semibold text-gray-700 mb-2">

            Role

          </label>

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            className="w-full border border-gray-300 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          >

            <option value="EMPLOYEE">

              EMPLOYEE

            </option>

            <option value="HR_MANAGER">

              HR MANAGER

            </option>

            <option value="ADMIN">

              ADMIN

            </option>

          </select>

        </div>

        {/* Register Button */}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition text-lg font-semibold shadow-md disabled:bg-blue-300"
        >

          {

            loading
              ? "Registering..."
              : "Register"
          }

        </button>

        {/* Login */}

        <div className="text-center mt-6">

          <p className="text-gray-500">

            Already have an account?

          </p>

          <Link
            to="/"
            className="text-blue-600 font-semibold hover:text-blue-700"
          >

            Login Here

          </Link>

        </div>

      </div>

    </div>
  )
}

export default RegisterPage