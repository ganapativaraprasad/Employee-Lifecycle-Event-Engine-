import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { createUser, listUsers } from "../services/userService"
import { listEmployees } from "../services/employeeService"
 
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

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

const UserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["EMPLOYEE", "HR_MANAGER"]),
})

type UserFormValues = z.infer<typeof UserSchema>

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

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    if (success) toast.success(success)
  }, [success])

  const [creating, setCreating] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting, isValid } } = useForm<UserFormValues>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
    },
    mode: "onBlur",
  })

  const [employeeFilter, setEmployeeFilter] = useState<string>("ALL")

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
    const load = async () => {
      await loadUsers()
      await loadEmployees()
    }

    load()
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

  const handleCreateUser = async (data: UserFormValues) => {
    try {
      setCreating(true)
      setError("")
      setSuccess("")

      await createUser({
        ...data,
        role: isAdmin ? data.role : "EMPLOYEE",
      })

      reset()
      await loadUsers()
      toast.success("User created successfully")
      setSuccess("User created successfully")
    } catch (error: any) {
      console.log(error)
      const msg = error?.response?.data?.detail || "Failed to create user"
      toast.error(msg)
      setError(msg)
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

      {/* Inline notices replaced by Sonner toasts */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <div className="bg-white rounded-2xl shadow-md p-6">

          <h2 className="text-xl font-semibold text-gray-800 mb-4">

            Create Account

          </h2>


          <form onSubmit={handleSubmit(handleCreateUser)} className="space-y-4">
            <Input {...register("username")} placeholder="Username" />
            {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}

            <Input {...register("email")} type="email" placeholder="Email" />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}

            <Input {...register("password")} type="password" placeholder="Temporary password" />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}

            <Select defaultValue={"EMPLOYEE"} onValueChange={(v) => setValue("role", v as any)}>
              <SelectTrigger className="w-full" disabled={!isAdmin}>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {canCreateRoles.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!isAdmin && (
              <p className="text-xs text-gray-500">HR can only create employee accounts.</p>
            )}

            <Button type="submit" className="mt-6 w-full" disabled={creating || isSubmitting || !isValid}>{creating || isSubmitting ? "Creating..." : "Create Account"}</Button>
          </form>

        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl shadow-md p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-semibold text-gray-800">

              Existing Users

            </h2>
            <div>
              <Select value={employeeFilter} onValueChange={(v) => setEmployeeFilter(String(v))}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.email}>{emp.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
