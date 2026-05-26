import { useEffect, useMemo, useState } from "react"

import {
  createUser,
  listUsers
} from "../services/userService"
import { listEmployees } from "../services/employeeService"
import InlineNotice from "../components/InlineNotice"

type User = {
  id: string
  username: string
  email: string
  role: string
  is_active: boolean
}

type Employee = {
  id: string
  email: string
}

const emptyForm = {
  username: "",
  email: "",
  password: "",
  role: "EMPLOYEE"
}

function UsersPage() {

  const role = localStorage.getItem(
    "user_role"
  )

  const isAdmin = role === "ADMIN"

  const [users, setUsers] =
    useState<User[]>([])

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const [formData, setFormData] =
    useState(emptyForm)

  const [creating, setCreating] =
    useState(false)

  const canCreateRoles = useMemo(() => {

    if (isAdmin) {
      return ["EMPLOYEE", "HR_MANAGER"]
    }

    return ["EMPLOYEE"]

  }, [isAdmin])

  const loadUsers = async () => {

    if (!isAdmin) {
      return
    }

    try {

      setLoading(true)
      setError("")

      const data = await listUsers()

      setUsers(data)

    } catch (error) {

      console.log(error)

      setError("Failed to load users")

    } finally {

      setLoading(false)
    }
  }

  const loadEmployees = async () => {

    if (!isAdmin) {
      return
    }

    try {

      const data = await listEmployees({
        page: 1,
        limit: 2000
      })

      setEmployees(data.items || [])

    } catch (error) {

      console.log(error)
    }
  }

  useEffect(() => {

    loadUsers()
    loadEmployees()

  }, [isAdmin])

  const visibleUsers = useMemo(() => {

    if (!isAdmin) {
      return [] as User[]
    }

    const employeeEmails = new Set(
      employees.map((employee) =>
        employee.email.toLowerCase()
      )
    )

    return users.filter((user) => {
      if (user.role !== "EMPLOYEE") {
        return true
      }

      return employeeEmails.has(
        user.email.toLowerCase()
      )
    })

  }, [employees, isAdmin, users])

  const handleCreateUser = async () => {

    try {

      setCreating(true)
      setError("")
      setSuccess("")

      await createUser({
        ...formData,
        role: isAdmin
          ? formData.role
          : "EMPLOYEE"
      })

      setFormData({
        ...emptyForm,
        role: isAdmin
          ? formData.role
          : "EMPLOYEE"
      })

      await loadUsers()

      setSuccess("User created successfully")

    } catch (error: any) {

      console.log(error)

      setError(
        error?.response?.data?.detail ||
        "Failed to create user"
      )

    } finally {

      setCreating(false)
    }
  }

  return (

    <div className="animate-fade-in">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>

          <h1 className="text-3xl font-bold text-gray-800">

            User Management

          </h1>

          <p className="text-gray-500 mt-1">

            Create HR and employee accounts with role-based access.

          </p>

        </div>

      </div>

      <InlineNotice message={error} variant="error" />

      <InlineNotice message={success} variant="success" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-semibold text-gray-800 mb-4">

            Create Account

          </h2>

          <div className="space-y-4">

            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value
                })
              }
              className="w-full border border-gray-300 p-3 rounded-xl"
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: e.target.value
                })
              }
              className="w-full border border-gray-300 p-3 rounded-xl"
            />

            <input
              type="password"
              placeholder="Temporary password"
              value={formData.password}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value
                })
              }
              className="w-full border border-gray-300 p-3 rounded-xl"
            />

            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value
                })
              }
              className="w-full border border-gray-300 p-3 rounded-xl"
              disabled={!isAdmin}
            >

              {canCreateRoles.map((option) => (

                <option key={option} value={option}>

                  {option}

                </option>
              ))}

            </select>

            {!isAdmin && (

              <p className="text-xs text-gray-500">

                HR can only create employee accounts.

              </p>
            )}

          </div>

          <button
            onClick={handleCreateUser}
            disabled={creating}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition text-white text-sm px-4 py-2 rounded-lg shadow-md disabled:bg-blue-300"
          >

            {creating ? "Creating..." : "Create Account"}

          </button>

        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl shadow-md p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-semibold text-gray-800">

              Existing Users

            </h2>

            {!isAdmin && (

              <span className="text-sm text-gray-500">

                Admin access required for user list

              </span>
            )}

          </div>

          {loading && (

            <div className="text-gray-500 text-sm">

              Loading users...

            </div>
          )}

          {!loading && isAdmin && visibleUsers.length === 0 && (

            <div className="text-gray-500 text-sm">

              No users found yet.

            </div>
          )}

          {!loading && isAdmin && visibleUsers.length > 0 && (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="text-left text-gray-500 border-b">

                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Status</th>

                  </tr>

                </thead>

                <tbody>

                  {visibleUsers.map((user) => (

                    <tr key={user.id} className="border-b">

                      <td className="py-4 pr-4">

                        <div className="font-medium text-gray-800">

                          {user.username}

                        </div>

                      </td>

                      <td className="py-4 pr-4 text-gray-600">

                        {user.email}

                      </td>

                      <td className="py-4 pr-4">

                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">

                          {user.role}

                        </span>

                      </td>

                      <td className="py-4 pr-4">

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>

                          {user.is_active ? "Active" : "Inactive"}

                        </span>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

          {!isAdmin && (

            <div className="text-gray-500 text-sm">

              You can create employee accounts, but only admins can view all users.

            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default UsersPage
