import axios from "../api/axios"

export const getCalendarEvents = async (year?: number) => {
  const params: any = {}
  if (year) params.year = year
  const res = await axios.get("/leaves/calendar", { params })
  return res.data
}

export const listHolidays = async (year?: number) => {
  const params: any = {}
  if (year) params.year = year
  const res = await axios.get("/calendar/holidays", { params })
  return res.data
}

export const createHoliday = async (payload: any) => {
  const res = await axios.post("/calendar/holidays", payload)
  return res.data
}

export const updateHoliday = async (holidayId: string, payload: any) => {
  const res = await axios.put(`/calendar/holidays/${holidayId}`, payload)
  return res.data
}

export const deleteHoliday = async (holidayId: string) => {
  const res = await axios.delete(`/calendar/holidays/${holidayId}`)
  return res.data
}

export const listCalendarEvents = async (year?: number) => {
  const params: any = {}
  if (year) params.year = year
  const res = await axios.get("/calendar/events", { params })
  return res.data
}

export const createCalendarEvent = async (payload: any) => {
  const res = await axios.post("/calendar/events", payload)
  return res.data
}

export const updateCalendarEvent = async (eventId: string, payload: any) => {
  const res = await axios.put(`/calendar/events/${eventId}`, payload)
  return res.data
}

export const deleteCalendarEvent = async (eventId: string) => {
  const res = await axios.delete(`/calendar/events/${eventId}`)
  return res.data
}

export default {
  getCalendarEvents,
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
}
