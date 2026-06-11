import api from "../api/axios"

const getToken = () => localStorage.getItem("access_token")

type EmployeeQuery = {
  page?: number
  limit?: number
  search?: string
  employee_code?: string
  name?: string
  department?: string
  designation?: string
  current_state?: string
  employment_status?: string
  leave_status?: string
  joined_from?: string
  joined_to?: string
  sort_by?: string
  sort_order?: string
}

export const getEmployees = async (query: EmployeeQuery = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, String(value))
  })

  const response = await api.get(`/employees?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })

  return response.data
}

export const listEmployees = async (query: { page?: number; limit?: number } = {}) => {
  return getEmployees(query)
}

export const createEmployee = async (employeeData: any) => {
  const response = await api.post("/employees", employeeData, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return response.data
}

export const deleteEmployee = async (employeeId: string) => {
  const response = await api.delete(`/employees/${employeeId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return response.data
}

export const updateEmployee = async (employeeId: string, employeeData: any) => {
  const response = await api.put(`/employees/${employeeId}`, employeeData, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return response.data
}

export const updateEmployeeStatus = async (
  employeeId: string,
  status: string,
  reason: string = "Status updated from frontend"
) => {
  const response = await api.post(
    `/employees/${employeeId}/transition`,
    { new_state: status, reason },
    { headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" } }
  )
  return response.data
}