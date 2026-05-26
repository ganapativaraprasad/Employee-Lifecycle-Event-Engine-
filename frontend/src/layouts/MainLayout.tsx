import { useState } from "react"

import {
  FaTachometerAlt,
  FaUsers,
  FaUserPlus,
  FaCalendarAlt,
  FaUserCog,
  FaSignOutAlt,
  FaUserCircle
} from "react-icons/fa"

import {
  Link,
  useLocation
} from "react-router-dom"

type Props = {
  children: React.ReactNode
}

function MainLayout({
  children
}: Props) {

  const location =
    useLocation()

  const [menuOpen, setMenuOpen] =
    useState(false)

  const logout = () => {

    localStorage.removeItem(
      "access_token"
    )

    localStorage.removeItem(
      "user_role"
    )

    window.location.href = "/"
  }

  const role =
    localStorage.getItem(
      "user_role"
    )

  const username =
    localStorage.getItem(
      "username"
    )

  const email =
    localStorage.getItem(
      "user_email"
    )

  const getRoleColor = () => {

    if (role === "ADMIN")
      return "bg-red-500"

    if (role === "HR_MANAGER")
      return "bg-yellow-500"

    return "bg-green-500"
  }

  return (

    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}

      <div className="w-55 bg-[#111827] text-white flex flex-col p-5 shadow-2xl">

        {/* LOGO */}

        <div className="mb-10">

          <h1 className="text-3xl font-bold text-center tracking-wide">

            HRMS

          </h1>

          <p className="text-gray-400 text-sm text-center mt-2">

            Employee Lifecycle Engine

          </p>

        </div>

        {/* NAVIGATION */}

        <nav className="flex flex-col gap-3">

          <Link
            to="/dashboard"
            className={`flex items-center gap-3 transition p-3 rounded-xl text-base font-medium

            ${location.pathname === "/dashboard"

              ? "bg-blue-600"

              : "hover:bg-gray-700"
            }`}
          >

            <FaTachometerAlt />

            Dashboard

          </Link>

          {role === "EMPLOYEE" ? (

            <Link
              to="/calendar"
              className={`flex items-center gap-3 transition p-3 rounded-xl text-base font-medium

              ${location.pathname === "/calendar"

                ? "bg-blue-600"

                : "hover:bg-gray-700"
              }`}
            >

              <FaCalendarAlt />

              Calendar

            </Link>

          ) : (

            <Link
              to="/employees"
              className={`flex items-center gap-3 transition p-3 rounded-xl text-base font-medium

              ${location.pathname === "/employees"

                ? "bg-blue-600"

                : "hover:bg-gray-700"
              }`}
            >

              <FaUsers />

              Employees

            </Link>

          )}

          <Link
            to="/leaves"
            className={`flex items-center gap-3 transition p-3 rounded-xl text-base font-medium

            ${location.pathname === "/leaves"

              ? "bg-blue-600"

              : "hover:bg-gray-700"
            }`}
          >

            <FaCalendarAlt />

            Leave Management

          </Link>



          {role === "ADMIN" && (

            <Link
              to="/users"
              className={`flex items-center gap-3 transition p-3 rounded-xl text-base font-medium

              ${location.pathname === "/users"

                ? "bg-blue-600"

                : "hover:bg-gray-700"
              }`}
            >

              <FaUserCog />

              User Management

            </Link>
          )}

        </nav>

      </div>

      {/* MAIN CONTENT */}

      <div className="flex-1 flex flex-col">

        {/* TOP HEADER */}

        <div className="bg-white shadow-sm px-6 py-3 flex justify-end items-center">

          <div className="flex items-center gap-4">

            <div className="text-right">

              <p className="text-sm text-gray-500">

                Logged in as

              </p>

              <div className="flex items-center gap-2 justify-end">

                <span
                  className={`text-white text-xs px-3 py-1 rounded-full font-semibold ${getRoleColor()}`}
                >

                  {role}

                </span>

              </div>

            </div>

            <div className="relative">

              <button
                onClick={() =>
                  setMenuOpen(!menuOpen)
                }
                className="flex items-center gap-3"
              >

                <div className="text-right hidden md:block">

                  <p className="text-sm text-gray-500">

                    {username || "User"}

                  </p>

                  <p className="text-xs text-gray-400">

                    {email || ""}

                  </p>

                </div>

                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">

                  <FaUserCircle />

                </div>

              </button>

              {menuOpen && (

                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20">

                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >

                    View Profile

                  </Link>

                  <Link
                    to="/change-password"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >

                    Change Password

                  </Link>

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >

                    Logout

                  </button>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* PAGE CONTENT */}

        <div className="p-8 overflow-y-auto">

          {children}

        </div>

      </div>

    </div>
  )
}

export default MainLayout