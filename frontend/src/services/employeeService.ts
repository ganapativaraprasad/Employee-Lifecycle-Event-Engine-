import api from "../api/axios"

const getToken = () => {

  return localStorage.getItem(
    "access_token"
  )
}

export const getEmployees = async () => {

  const response = await api.get(

    "/employees",

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const createEmployee = async (
  employeeData: any
) => {

  const response = await api.post(

    "/employees",

    employeeData,

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const deleteEmployee = async (
  employeeId: string
) => {

  const response = await api.delete(

    `/employees/${employeeId}`,

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const updateEmployee = async (
  employeeId: string,
  employeeData: any
) => {

  const response = await api.put(

    `/employees/${employeeId}`,

    employeeData,

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const updateEmployeeStatus = async (

  employeeId: string,

  status: string

) => {

  const response = await api.post(

    `/employees/${employeeId}/transition`,

    {
      new_state: status,
      reason: "Status updated from frontend"
    },

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`,
        "Content-Type":
          "application/json"
      }
    }
  )

  return response.data
}