import api from "../api/axios"

const getToken = () => {

  return localStorage.getItem(
    "access_token"
  )
}

type UserPayload = {
  username: string
  email: string
  password: string
  role: string
}

export const createUser = async (
  payload: UserPayload
) => {

  const response = await api.post(

    "/users",

    payload,

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const listUsers = async () => {

  const response = await api.get(

    "/users",

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const getMyProfile = async () => {

  const response = await api.get(

    "/users/me",

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const updateMyProfile = async (
  payload: { username?: string; email?: string }
) => {

  const response = await api.put(

    "/users/me",

    payload,

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const changeMyPassword = async (
  payload: { current_password: string; new_password: string }
) => {

  const response = await api.post(

    "/users/me/change-password",

    payload,

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}
