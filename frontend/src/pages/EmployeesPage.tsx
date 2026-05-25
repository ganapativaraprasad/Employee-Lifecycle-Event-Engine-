import { useEffect, useState } from "react"

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

function EmployeesPage() {

  const [employees, setEmployees] =
    useState<any[]>([])

  const [search, setSearch] =
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

      const data =
        await getEmployees()

      setEmployees(data)

    } catch (error) {

      console.log(error)
    }
  }

  useEffect(() => {

    fetchEmployees()

  }, [])

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

        await createEmployee(
          formData
        )

        await fetchEmployees()

        setShowModal(false)

        resetForm()

      } catch (error) {

        console.log(error)
      }
    }

  const handleDeleteEmployee =
    async (
      employeeId: string
    ) => {

      try {

        await deleteEmployee(
          employeeId
        )

        await fetchEmployees()

      } catch (error) {

        console.log(error)
      }
    }

  const handleEditEmployee = (
    employee: any
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

        await updateEmployee(

          selectedEmployeeId,

          formData
        )

        await fetchEmployees()

        setShowModal(false)

        resetForm()

      } catch (error) {

        console.log(error)
      }
    }

  const handleStatusUpdate =
    async (
      employeeId: string,
      status: string
    ) => {

      try {

        await updateEmployeeStatus(
          employeeId,
          status
        )

        await fetchEmployees()

      } catch (error) {

        console.log(error)

        alert("Status update failed")
      }
    }

  const filteredEmployees =
    employees.filter((employee) => {

      const fullName =

        `${employee.first_name}
        ${employee.last_name}`
          .toLowerCase()

      return (

        fullName.includes(
          search.toLowerCase()
        ) ||

        employee.email
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        employee.department
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||

        employee.employee_code
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
      )
    })

  return (

    <div>

      {/* HEADER */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-bold text-gray-800">

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
              className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-3 rounded-xl shadow-md"
            >

              + Add Employee

            </button>
          )
        }

      </div>

      {/* SEARCH */}

      <div className="mb-6">

        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full md:w-[400px] border border-gray-300 p-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

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
                Status
              </th>

              <th className="text-left p-4">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredEmployees.map((employee) => (

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

                {/* STATUS */}

                <td className="p-4">

                  <div className="flex items-center gap-3">

                    <span
                      className={`px-4 py-1 rounded-full text-sm font-semibold

                      ${employee.current_state === "ACTIVE"
                        ? "bg-green-100 text-green-700"

                        : employee.current_state === "OFFBOARDED"
                        ? "bg-red-100 text-red-700"

                        : employee.current_state === "SUSPENDED"
                        ? "bg-yellow-100 text-yellow-700"

                        : employee.current_state === "ON_LEAVE"
                        ? "bg-purple-100 text-purple-700"

                        : employee.current_state === "TRANSFERRED"
                        ? "bg-orange-100 text-orange-700"

                        : "bg-blue-100 text-blue-700"
                      }`}
                    >

                      {employee.current_state}

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

                            try {

                              await handleStatusUpdate(
                                employee.id,
                                selectedStatus
                              )

                              await fetchEmployees()

                            } catch (error) {

                              console.log(error)

                              alert("Status update failed")
                            }
                          }}

                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >

                          <option value="">
                            Change Status
                          </option>

                          {employee.current_state === "HIRED" && (

                            <option value="ONBOARDING">
                              ONBOARDING
                            </option>
                          )}

                          {employee.current_state === "ONBOARDING" && (

                            <option value="ACTIVE">
                              ACTIVE
                            </option>
                          )}

                          {employee.current_state === "ACTIVE" && (

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

                          {employee.current_state === "ON_LEAVE" && (

                            <>
                              <option value="ACTIVE">
                                ACTIVE
                              </option>

                              <option value="OFFBOARDED">
                                OFFBOARDED
                              </option>
                            </>
                          )}

                          {employee.current_state === "TRANSFERRED" && (

                            <option value="ACTIVE">
                              ACTIVE
                            </option>
                          )}

                          {employee.current_state === "SUSPENDED" && (

                            <>
                              <option value="ACTIVE">
                                ACTIVE
                              </option>

                              <option value="OFFBOARDED">
                                OFFBOARDED
                              </option>
                            </>
                          )}

                          {employee.current_state === "OFFBOARDED" && (

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
            ))}

          </tbody>

        </table>

      </div>

      {/* MODAL */}

      {

        showModal && (

          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

            <div className="bg-white w-[500px] rounded-2xl p-8 shadow-2xl">

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
                  className="px-5 py-3 rounded-xl bg-gray-200 hover:bg-gray-300"
                >

                  Cancel

                </button>

                <button
                  onClick={
                    isEdit
                    ? handleUpdateEmployee
                    : handleCreateEmployee
                  }
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
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