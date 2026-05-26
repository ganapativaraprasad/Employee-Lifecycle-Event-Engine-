import api from "../api/axios"

const getToken = () => {

  return localStorage.getItem(
    "access_token"
  )
}

type LeaveApplyPayload = {
  employee_id?: string
  start_date: string
  end_date: string
  reason: string
  leave_type?: string
}

type LeaveDecisionPayload = {
  decision_note?: string
}

type LeaveQuery = {
  page?: number
  limit?: number
  status?: string
  employee_id?: string
  start_from?: string
  end_to?: string
}

export const applyLeave = async (
  payload: LeaveApplyPayload
) => {

  const response = await api.post(

    "/leaves/apply",

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

export const listMyLeaves = async (
  query: LeaveQuery
) => {

  const params = new URLSearchParams()

  Object.entries(query).forEach(
    ([key, value]) => {

      if (value !== undefined && value !== "") {
        params.append(key, String(value))
      }
    }
  )

  const response = await api.get(

    `/leaves/my?${params.toString()}`,

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const listLeaves = async (
  query: LeaveQuery
) => {

  const params = new URLSearchParams()

  Object.entries(query).forEach(
    ([key, value]) => {

      if (value !== undefined && value !== "") {
        params.append(key, String(value))
      }
    }
  )

  const response = await api.get(

    `/leaves?${params.toString()}`,

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}

export const approveLeave = async (
  leaveId: string,
  payload: LeaveDecisionPayload
) => {

  const response = await api.put(

    `/leaves/${leaveId}/approve`,

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

export const rejectLeave = async (
  leaveId: string,
  payload: LeaveDecisionPayload
) => {

  const response = await api.put(

    `/leaves/${leaveId}/reject`,

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

export const getLeaveStats = async () => {

  const response = await api.get(

    "/leaves/stats",

    {
      headers: {
        Authorization:
          `Bearer ${getToken()}`
      }
    }
  )

  return response.data
}
