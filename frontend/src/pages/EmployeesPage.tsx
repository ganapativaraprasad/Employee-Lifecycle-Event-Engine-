import { useEffect, useMemo, useState } from "react"

import {
  FaEdit,
  FaTrash
} from "react-icons/fa"

import {
  getEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  updateEmployeeStatus
} from "../services/employeeService"
import { listLeaves } from "../services/leaveService"
import InlineNotice from "../components/InlineNotice"

type Employee = {
  id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  department: string
  designation: string
  current_state: string
  created_at: string
}

type EmployeeResponse = {
  items: Employee[]
  total: number
  page: number
  limit: number
}

type LeaveItem = {
  employee_id: string
  employee_email: string
  start_date: string
  end_date: string
  status: string
}

const defaultFilters = {
  search: "",
  employee_code: "",
  department: "",
  designation: "",
  current_state: "",
  employment_status: "",
  leave_status: "",
  joined_from: "",
  joined_to: "",
  sort_by: "created_at",
  sort_order: "desc"
}

function EmployeesPage() {

  const [employees, setEmployees] =
    useState<Employee[]>([])

  const [allLeaves, setAllLeaves] =
    useState<LeaveItem[]>([])

  const [total, setTotal] =
    useState(0)

  const [page, setPage] =
    useState(1)

  const [limit, setLimit] =
    useState(1000)

  const [filters, setFilters] =
    useState(defaultFilters)

  const [appliedFilters, setAppliedFilters] =
    useState(defaultFilters)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const [showModal, setShowModal] =
    useState(false)

  const [isEdit, setIsEdit] =
    useState(false)

  const [
    selectedEmployeeId,
    setSelectedEmployeeId
  ] = useState("")

  const [formData, setFormData] =
    useState({

      employee_code: "",
      first_name: "",
      last_name: "",
      email: "",
      department: "",
      designation: ""
    })

  const role =
    localStorage.getItem(
      "user_role"
    )

  const fetchEmployees = async () => {

    try {

      setLoading(true)
      setError("")
      setSuccess("")

      const data: EmployeeResponse =
        await getEmployees({
          ...appliedFilters,
          page,
          limit
        })

      setEmployees(data.items)
      setTotal(data.total)

    } catch (error) {

      console.log(error)

      setError("Failed to load employees")

    } finally {

      setLoading(false)
    }
  }

  const fetchAllLeaves = async () => {

    if (role === "EMPLOYEE") {
      return
    }

    try {

      const data = await listLeaves({
        page: 1,
        limit: 2000
      })

      setAllLeaves(data.items || [])

    } catch (error) {

      console.log(error)
    }
  }

  useEffect(() => {

    fetchEmployees()
    fetchAllLeaves()

  }, [page, limit, appliedFilters])

  const onLeaveMap = useMemo(() => {
    const map = new Set<string>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    allLeaves.forEach((leave) => {
      if (leave.status !== "APPROVED") {
        return
      }

      const start = new Date(leave.start_date)
      const end = new Date(leave.end_date)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      if (start <= today && end >= today) {
        if (leave.employee_id) {
          map.add(leave.employee_id)
        }
        if (leave.employee_email) {
          map.add(leave.employee_email.toLowerCase())
        }
      }
    })

    return map
  }, [allLeaves])

  const resetForm = () => {

    setFormData({

      employee_code: "",
      first_name: "",
      last_name: "",
      email: "",
      department: "",
      designation: ""
    })

    setIsEdit(false)

    setSelectedEmployeeId("")
  }

  const handleCreateEmployee =
    async () => {

      try {

        setError("")
        setSuccess("")

        await createEmployee(
          formData
        )

        await fetchEmployees()

        setShowModal(false)

        resetForm()

        setSuccess("Employee created successfully")

      } catch (error) {

        console.log(error)

        setError("Failed to create employee")
      }
    }

  const handleDeleteEmployee =
    async (
      employeeId: string
    ) => {

      try {

        setError("")
        setSuccess("")

        await deleteEmployee(
          employeeId
        )

        await fetchEmployees()

        setSuccess("Employee deleted successfully")

      } catch (error) {

        console.log(error)

        setError("Failed to delete employee")
      }
    }

  const handleEditEmployee = (
    employee: Employee
  ) => {

    setIsEdit(true)

    setSelectedEmployeeId(
      employee.id
    )

    setFormData({

      employee_code:
        employee.employee_code,

      first_name:
        employee.first_name,

      last_name:
        employee.last_name,

      email:
        employee.email,

      department:
        employee.department,

      designation:
        employee.designation
    })

    setShowModal(true)
  }

  const handleUpdateEmployee =
    async () => {

      try {

        setError("")
        setSuccess("")

        await updateEmployee(

          selectedEmployeeId,

          formData
        )

        await fetchEmployees()

        setShowModal(false)

        resetForm()

        setSuccess("Employee updated successfully")

      } catch (error) {

        console.log(error)

        setError("Failed to update employee")
      }
    }

  const handleStatusUpdate =
    async (
      employeeId: string,
      status: string
    ) => {

      try {

        setError("")
        setSuccess("")

        await updateEmployeeStatus(
          employeeId,
          status
        )

        await fetchEmployees()

        setSuccess("Employee status updated")

      } catch (error) {

        console.log(error)

        setError("Status update failed")
      }
    }

  const applyFilters = () => {

    setPage(1)
    setAppliedFilters(filters)
  }

  const clearFilters = () => {

    setPage(1)
    setFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
  }

  const totalPages = Math.max(
    1,
    Math.ceil(total / limit)
  )

  const startIndex =
    total === 0
      ? 0
      : (page - 1) * limit + 1

  const endIndex = Math.min(
    page * limit,
    total
  )

  return (

    <div className="animate-fade-in">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

        <div>

          <h1 className="text-3xl font-bold text-gray-800">

            Employees

          </h1>

          <p className="text-gray-500 mt-1">

            Manage your employees

          </p>

        </div>

        {

          role !== "EMPLOYEE" && (

            <button
              onClick={() => {

                resetForm()

                setShowModal(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 transition text-white text-sm px-4 py-2 rounded-lg shadow-md"
            >

              + Add Employee

            </button>
          )
        }

      </div>

      <InlineNotice message={error} variant="error" />

      <InlineNotice message={success} variant="success" />

      {/* FILTERS */}

      <div className="bg-white rounded-2xl shadow-md p-6 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          <input
            type="text"
            placeholder="Search name, email, or code"
            value={filters.search}
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Employee ID"
            value={filters.employee_code}
            onChange={(e) =>
              setFilters({
                ...filters,
                employee_code: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Department"
            value={filters.department}
            onChange={(e) =>
              setFilters({
                ...filters,
                department: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            placeholder="Designation"
            value={filters.designation}
            onChange={(e) =>
              setFilters({
                ...filters,
                designation: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.employment_status}
            onChange={(e) =>
              setFilters({
                ...filters,
                employment_status: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="">Employment Status</option>

            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="OFFBOARDED">Offboarded</option>
          </select>

          <select
            value={filters.current_state}
            onChange={(e) =>
              setFilters({
                ...filters,
                current_state: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="">FSM State</option>
            <option value="HIRED">HIRED</option>
            <option value="ONBOARDING">ONBOARDING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ON_LEAVE">ON_LEAVE</option>
            <option value="TRANSFERRED">TRANSFERRED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="OFFBOARDED">OFFBOARDED</option>
          </select>

          <select
            value={filters.leave_status}
            onChange={(e) =>
              setFilters({
                ...filters,
                leave_status: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="">Leave Status</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="NOT_ON_LEAVE">Not On Leave</option>
          </select>

          <input
            type="date"
            value={filters.joined_from}
            onChange={(e) =>
              setFilters({
                ...filters,
                joined_from: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="date"
            value={filters.joined_to}
            onChange={(e) =>
              setFilters({
                ...filters,
                joined_to: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.sort_by}
            onChange={(e) =>
              setFilters({
                ...filters,
                sort_by: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="created_at">Sort by Joined</option>
            <option value="employee_code">Sort by Employee ID</option>
            <option value="first_name">Sort by First Name</option>
            <option value="last_name">Sort by Last Name</option>
            <option value="department">Sort by Department</option>
            <option value="designation">Sort by Designation</option>
          </select>

          <select
            value={filters.sort_order}
            onChange={(e) =>
              setFilters({
                ...filters,
                sort_order: e.target.value
              })
            }
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >

            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>

        </div>

        <div className="flex flex-wrap gap-3 mt-6">

          <button
            onClick={applyFilters}
            className="bg-blue-600 hover:bg-blue-700 transition text-white text-sm px-4 py-2 rounded-lg shadow-md"
          >

            Apply Filters

          </button>

          <button
            onClick={clearFilters}
            className="bg-gray-100 hover:bg-gray-200 transition text-gray-700 text-sm px-4 py-2 rounded-lg"
          >

            Clear

          </button>

          <div className="ml-auto flex items-center gap-3">

            <span className="text-sm text-gray-500">

              Rows per page

            </span>

            <select
              value={limit}
              onChange={(e) =>
                setLimit(Number(e.target.value))
              }
              className="border border-gray-300 p-2 rounded-lg"
            >

              <option value={1000}>All</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>

          </div>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="text-left p-4">
                Employee Code
              </th>

              <th className="text-left p-4">
                Name
              </th>

              <th className="text-left p-4">
                Email
              </th>

              <th className="text-left p-4">
                Department
              </th>

              <th className="text-left p-4">
                Designation
              </th>

              <th className="text-left p-4">
                Joined
              </th>

              <th className="text-left p-4">
                Status
              </th>

              <th className="text-left p-4">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan={8}
                  className="p-6 text-center text-gray-500"
                >

                  Loading employees...

                </td>

              </tr>
            )}

            {!loading && error && (

              <tr>

                <td
                  colSpan={8}
                  className="p-6 text-center text-red-500"
                >

                  {error}

                </td>

              </tr>
            )}

            {!loading && !error && employees.length === 0 && (

              <tr>

                <td
                  colSpan={8}
                  className="p-6 text-center text-gray-500"
                >

                  No employees match your filters.

                </td>

              </tr>
            )}

            {!loading && !error && employees.map((employee) => {

              const isOnLeave =
                onLeaveMap.has(employee.id) ||
                onLeaveMap.has(
                  employee.email.toLowerCase()
                )

              const displayState =
                isOnLeave
                  ? "ON_LEAVE"
                  : employee.current_state

              return (

              <tr
                key={employee.id}
                className="border-t hover:bg-gray-50 transition"
              >

                <td className="p-4 font-medium">

                  {employee.employee_code}

                </td>

                <td className="p-4">

                  {employee.first_name}
                  {" "}
                  {employee.last_name}

                </td>

                <td className="p-4 text-gray-600">

                  {employee.email}

                </td>

                <td className="p-4">

                  {employee.department}

                </td>

                <td className="p-4">

                  {employee.designation}

                </td>

                <td className="p-4 text-gray-600">

                  {new Date(employee.created_at).toLocaleDateString()}

                </td>

                {/* STATUS */}

                <td className="p-4">

                  <div className="flex items-center gap-3">

                    <span
                      className={`px-4 py-1 rounded-full text-sm font-semibold

                      ${displayState === "ACTIVE"
                        ? "bg-green-100 text-green-700"

                        : displayState === "OFFBOARDED"
                        ? "bg-red-100 text-red-700"

                        : displayState === "SUSPENDED"
                        ? "bg-yellow-100 text-yellow-700"

                        : displayState === "ON_LEAVE"
                        ? "bg-purple-100 text-purple-700"

                        : displayState === "TRANSFERRED"
                        ? "bg-orange-100 text-orange-700"

                        : "bg-blue-100 text-blue-700"
                      }`}
                    >

                      {displayState}

                    </span>

                    {

                      role !== "EMPLOYEE"

                      ? (

                        <select

                          defaultValue=""

                          onChange={async (e) => {

                            const selectedStatus =
                              e.target.value

                            if (!selectedStatus)
                              return

                            await handleStatusUpdate(
                              employee.id,
                              selectedStatus
                            )
                          }}

                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >

                          <option value="">
                            Change Status
                          </option>

                          {displayState === "HIRED" && (

                            <option value="ONBOARDING">
                              ONBOARDING
                            </option>
                          )}

                          {displayState === "ONBOARDING" && (

                            <option value="ACTIVE">
                              ACTIVE
                            </option>
                          )}

                          {displayState === "ACTIVE" && (

                            <>
                              <option value="ON_LEAVE">
                                ON_LEAVE
                              </option>

                              <option value="TRANSFERRED">
                                TRANSFERRED
                              </option>

                              <option value="SUSPENDED">
                                SUSPENDED
                              </option>

                              <option value="OFFBOARDED">
                                OFFBOARDED
                              </option>
                            </>
                          )}

                          {displayState === "ON_LEAVE" && (

                            <>
                              <option value="ACTIVE">
                                ACTIVE
                              </option>

                              <option value="OFFBOARDED">
                                OFFBOARDED
                              </option>
                            </>
                          )}

                          {displayState === "TRANSFERRED" && (

                            <option value="ACTIVE">
                              ACTIVE
                            </option>
                          )}

                          {displayState === "SUSPENDED" && (

                            <>
                              <option value="ACTIVE">
                                ACTIVE
                              </option>

                              <option value="OFFBOARDED">
                                OFFBOARDED
                              </option>
                            </>
                          )}

                          {displayState === "OFFBOARDED" && (

                            <option value="ACTIVE">
                              ACTIVE
                            </option>
                          )}

                        </select>

                      ) : (

                        <span className="text-gray-400 text-sm">

                          No Access

                        </span>
                      )
                    }

                  </div>

                </td>

                {/* ACTIONS */}

                <td className="p-4">

                  {

                    role === "ADMIN" ||

                    role === "HR_MANAGER"

                    ? (

                      <div className="flex gap-3">

                        {/* EDIT */}

                        <button
                          onClick={() =>
                            handleEditEmployee(
                              employee
                            )
                          }
                          className="bg-yellow-100 text-yellow-700 p-2 rounded-lg hover:bg-yellow-200"
                        >

                          <FaEdit />

                        </button>

                        {/* DELETE ONLY ADMIN */}

                        {

                          role === "ADMIN" && (

                            <button
                              onClick={() =>
                                handleDeleteEmployee(
                                  employee.id
                                )
                              }
                              className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200"
                            >

                              <FaTrash />

                            </button>
                          )
                        }

                      </div>

                    ) : (

                      <span className="text-gray-400 text-sm">

                        No Access

                      </span>
                    )
                  }

                      </td>

                    </tr>
                  )
                })}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">

        <div className="text-sm text-gray-500">

          Showing {startIndex} - {endIndex} of {total}

        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:text-gray-400 disabled:border-gray-200"
          >

            Previous

          </button>

          <span className="text-sm text-gray-600">

            Page {page} of {totalPages}

          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:text-gray-400 disabled:border-gray-200"
          >

            Next

          </button>

        </div>

      </div>

      {/* MODAL */}

      {

        showModal && (

          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

            <div className="bg-white w-125 rounded-2xl p-8 shadow-2xl">

              <h2 className="text-3xl font-bold mb-6">

                {isEdit
                  ? "Edit Employee"
                  : "Add Employee"}

              </h2>

              <div className="space-y-4">

                <input
                  type="text"
                  placeholder="Employee Code"
                  value={formData.employee_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employee_code:
                        e.target.value
                    })
                  }
                  className="w-full border p-3 rounded-xl"
                />

                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      first_name:
                        e.target.value
                    })
                  }
                  className="w-full border p-3 rounded-xl"
                />

                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      last_name:
                        e.target.value
                    })
                  }
                  className="w-full border p-3 rounded-xl"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email:
                        e.target.value
                    })
                  }
                  className="w-full border p-3 rounded-xl"
                />

                <input
                  type="text"
                  placeholder="Department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department:
                        e.target.value
                    })
                  }
                  className="w-full border p-3 rounded-xl"
                />

                <input
                  type="text"
                  placeholder="Designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      designation:
                        e.target.value
                    })
                  }
                  className="w-full border p-3 rounded-xl"
                />

              </div>

              <div className="flex justify-end gap-4 mt-8">

                <button
                  onClick={() => {

                    setShowModal(false)

                    resetForm()
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
                >

                  Cancel

                </button>

                <button
                  onClick={
                    isEdit
                    ? handleUpdateEmployee
                    : handleCreateEmployee
                  }
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                >

                  {isEdit
                    ? "Update Employee"
                    : "Create Employee"}

                </button>

              </div>

            </div>

          </div>
        )
      }

    </div>
  )
}

export default EmployeesPage