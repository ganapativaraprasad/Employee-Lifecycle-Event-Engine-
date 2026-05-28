import api from "../api/axios"

export const loginUser = async (

  email: string,
  password: string

) => {

  const formData = new URLSearchParams()

  formData.append("username", email)

  formData.append("password", password)

  const response = await api.post(

    "/auth/login",

    formData,

    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      }
    }
  )

  return response.data
}

export const forgotPassword = async (email: string) => {
  const response = await api.post(
    "/users/forgot-password",
    { email },
    { headers: { "Content-Type": "application/json" } }
  )

  return response.data
}

export const resetPassword = async (payload: { email: string; code: string; new_password: string }) => {
  const response = await api.post(
    "/users/reset-password",
    payload,
    { headers: { "Content-Type": "application/json" } }
  )

  return response.data
}