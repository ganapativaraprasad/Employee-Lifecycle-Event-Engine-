import axios from "../api/axios"

export const getCalendarEvents = async (year?: number) => {
  const params: any = {}
  if (year) params.year = year
  const res = await axios.get("/leaves/calendar", { params })
  return res.data
}

export default { getCalendarEvents }
