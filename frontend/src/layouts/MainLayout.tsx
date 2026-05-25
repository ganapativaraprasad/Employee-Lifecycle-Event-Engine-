import {
  FaTachometerAlt,
  FaUsers,
  FaUserPlus,
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

      <div className="w-[260px] bg-[#111827] text-white flex flex-col p-6 shadow-2xl">

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

        <nav className="flex flex-col gap-4">

          <Link
            to="/dashboard"
            className={`flex items-center gap-3 transition p-4 rounded-xl text-lg font-medium

            ${location.pathname === "/dashboard"

              ? "bg-blue-600"

              : "hover:bg-gray-700"
            }`}
          >

            <FaTachometerAlt />

            Dashboard

          </Link>

          <Link
            to="/employees"
            className={`flex items-center gap-3 transition p-4 rounded-xl text-lg font-medium

            ${location.pathname === "/employees"

              ? "bg-blue-600"

              : "hover:bg-gray-700"
            }`}
          >

            <FaUsers />

            Employees

          </Link>

          <Link
            to="/onboarding"
            className={`flex items-center gap-3 transition p-4 rounded-xl text-lg font-medium

            ${location.pathname === "/onboarding"

              ? "bg-blue-600"

              : "hover:bg-gray-700"
            }`}
          >

            <FaUserPlus />

            Onboarding

          </Link>

        </nav>

        {/* LOGOUT */}

        <div className="mt-auto">

          <button
            onClick={logout}
            className="flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 transition p-4 rounded-xl w-full text-lg font-medium shadow-md"
          >

            <FaSignOutAlt />

            Logout

          </button>

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="flex-1 flex flex-col">

        {/* TOP HEADER */}

        <div className="bg-white shadow-sm px-8 py-4 flex justify-end items-center">

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

            <div className="text-4xl text-gray-600">

              <FaUserCircle />

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