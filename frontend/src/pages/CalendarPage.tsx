import { useEffect, useMemo, useState } from "react"

import InlineNotice from "../components/InlineNotice"
import {
  createHoliday,
  getCalendarEvents,
  listHolidays
} from "../services/calendarService"

type LeaveEvent = {
  id: string
  employee_id?: string
  employee_name: string
  start_date: string
  end_date: string
  leave_type?: string
  status: string
  reason?: string
}

type HolidayItem = {
  id: string
  date: string
  name: string
  description?: string
  type: "PUBLIC" | "OPTIONAL"
}

type CalendarView = "MONTH" | "YEAR" | "UPCOMING"

type CombinedItem = {
  id: string
  kind: "HOLIDAY" | "LEAVE"
  date: string
  title: string
  subtitle?: string
  badge: string
  badgeStyle: string
  raw: HolidayItem | LeaveEvent
}

const DEFAULT_HOLIDAYS_2026: HolidayItem[] = [
  {
    id: "seed-2026-01-01",
    date: "2026-01-01",
    name: "New Year's Day",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-01-15",
    date: "2026-01-15",
    name: "Sankranti / Pongal / Makar Sankranti",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-01-26",
    date: "2026-01-26",
    name: "Republic Day",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-03-21",
    date: "2026-03-21",
    name: "Ramzan / Eid",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-05-01",
    date: "2026-05-01",
    name: "May Day",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-05-27",
    date: "2026-05-27",
    name: "Bakrid",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-06-02",
    date: "2026-06-02",
    name: "Telangana State Formation Day",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-08-15",
    date: "2026-08-15",
    name: "Independence Day",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-09-14",
    date: "2026-09-14",
    name: "Ganesh Chaturthi",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-10-02",
    date: "2026-10-02",
    name: "Mahatma Gandhi Jayanti",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-10-21",
    date: "2026-10-21",
    name: "Dussehra",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-11-08",
    date: "2026-11-08",
    name: "Deepawali",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-12-25",
    date: "2026-12-25",
    name: "Christmas",
    description: "Company public holiday",
    type: "PUBLIC"
  },
  {
    id: "seed-2026-03-04",
    date: "2026-03-04",
    name: "Holi",
    description: "Optional company holiday",
    type: "OPTIONAL"
  },
  {
    id: "seed-2026-03-19",
    date: "2026-03-19",
    name: "Ugadi",
    description: "Optional company holiday",
    type: "OPTIONAL"
  },
  {
    id: "seed-2026-03-26",
    date: "2026-03-26",
    name: "Sri Rama Navami",
    description: "Optional company holiday",
    type: "OPTIONAL"
  },
  {
    id: "seed-2026-04-03",
    date: "2026-04-03",
    name: "Good Friday",
    description: "Optional company holiday",
    type: "OPTIONAL"
  },
  {
    id: "seed-2026-08-10",
    date: "2026-08-10",
    name: "Bonalu",
    description: "Optional company holiday",
    type: "OPTIONAL"
  },
  {
    id: "seed-2026-08-26",
    date: "2026-08-26",
    name: "Eid Milad",
    description: "Optional company holiday",
    type: "OPTIONAL"
  }
]

const badgeStyles = {
  holidayPublic: "bg-rose-100 text-rose-700",
  holidayOptional: "bg-amber-100 text-amber-700",
  leave: "bg-emerald-100 text-emerald-700"
}

const dotStyles = {
  holidayPublic: "bg-rose-400",
  holidayOptional: "bg-amber-400",
  leave: "bg-emerald-500"
}

function CalendarPage() {

  const role = localStorage.getItem("user_role")
  const isAdminHr = role === "ADMIN" || role === "HR_MANAGER"

  const [events, setEvents] = useState<LeaveEvent[]>([])
  const [holidays, setHolidays] = useState<HolidayItem[]>([])

  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [monthIndex, setMonthIndex] = useState<number>(new Date().getMonth())
  const [view, setView] = useState<CalendarView>("YEAR")
  const [search, setSearch] = useState("")

  const [showPublicHolidays, setShowPublicHolidays] = useState(true)
  const [showOptionalHolidays, setShowOptionalHolidays] = useState(true)
  const [showLeaves, setShowLeaves] = useState(true)
  const [highlightToday, setHighlightToday] = useState(true)

  const [selectedLeave, setSelectedLeave] = useState<LeaveEvent | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [hasSeededDefaults, setHasSeededDefaults] = useState(false)

  const formatLocalDate = (date: Date) => {
    const yearValue = date.getFullYear()
    const monthValue = String(date.getMonth() + 1).padStart(2, "0")
    const dayValue = String(date.getDate()).padStart(2, "0")
    return `${yearValue}-${monthValue}-${dayValue}`
  }

  const todayIso = formatLocalDate(new Date())

  const months = Array.from({ length: 12 }, (_, index) => index)

  const normalizeList = (data: any) => {
    if (!data) {
      return []
    }

    if (Array.isArray(data)) {
      return data
    }

    if (Array.isArray(data.items)) {
      return data.items
    }

    return []
  }

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      setError("")

      const [leaveResult, holidayResult] = await Promise.allSettled([
        getCalendarEvents(year),
        listHolidays(year)
      ])

      const leaveData =
        leaveResult.status === "fulfilled" ? leaveResult.value : []
      const holidayData =
        holidayResult.status === "fulfilled" ? holidayResult.value : []

      const holidayItems = normalizeList(holidayData)

      setEvents(normalizeList(leaveData))
      setHolidays(holidayItems)

      const hasHolidayData = holidayItems.length > 0 || year === 2026

      if (leaveResult.status === "rejected" && holidayResult.status === "rejected") {
        setError(
          hasHolidayData
            ? ""
            : "Unable to load calendar data. Please try again."
        )
      } else if (hasHolidayData) {
        setError("")
      }

      if (
        year === 2026 &&
        holidayItems.length === 0 &&
        isAdminHr &&
        !hasSeededDefaults &&
        holidayResult.status === "fulfilled"
      ) {
        try {
          await Promise.all(
            DEFAULT_HOLIDAYS_2026.map((holiday) =>
              createHoliday({
                name: holiday.name,
                description: holiday.description,
                date: holiday.date,
                type: holiday.type
              })
            )
          )
          setHasSeededDefaults(true)

          const seeded = await listHolidays(year)
          setHolidays(normalizeList(seeded))
          setSuccess("Default holidays were added for 2026.")
        } catch (seedError) {
          console.log(seedError)
        }
      }
    } catch (err) {
      console.log(err)
      const fallbackHasHolidayData = year === 2026 || holidays.length > 0
      setError(
        fallbackHasHolidayData
          ? ""
          : "Unable to load calendar data. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendarData()
  }, [year])

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => setSuccess(""), 3000)
      return () => clearTimeout(timeout)
    }

    return undefined
  }, [success])

  const resolvedHolidays = useMemo(() => {
    if (holidays.length > 0) {
      return holidays
    }

    if (year === 2026) {
      return DEFAULT_HOLIDAYS_2026
    }

    return []
  }, [holidays, year])

  const holidayList = useMemo(() => {
    return resolvedHolidays
      .filter((holiday) => {
        if (holiday.type === "PUBLIC" && !showPublicHolidays) {
          return false
        }

        if (holiday.type === "OPTIONAL" && !showOptionalHolidays) {
          return false
        }

        if (search) {
          const query = search.toLowerCase()
          return (
            holiday.name.toLowerCase().includes(query) ||
            (holiday.description || "").toLowerCase().includes(query)
          )
        }

        return true
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [resolvedHolidays, showPublicHolidays, showOptionalHolidays, search])

  const filteredLeaves = useMemo(() => {
    return events.filter((leave) => {
      const status = leave.status ? leave.status.toUpperCase() : ""
      if (!status.includes("APPROVED")) {
        return false
      }

      if (!showLeaves) {
        return false
      }

      if (search) {
        const query = search.toLowerCase()
        return (
          leave.employee_name.toLowerCase().includes(query) ||
          (leave.reason || "").toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [events, showLeaves, search])

  const holidayMap = useMemo(() => {
    const map: Record<string, HolidayItem[]> = {}

    holidayList.forEach((holiday) => {
      if (!map[holiday.date]) {
        map[holiday.date] = []
      }

      map[holiday.date].push(holiday)
    })

    return map
  }, [holidayList])

  const eventMap = useMemo(() => {
    const map: Record<string, LeaveEvent[]> = {}

    filteredLeaves.forEach((event) => {
      const start = new Date(event.start_date)
      const end = new Date(event.end_date)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      for (
        let cursor = new Date(start);
        cursor <= end;
        cursor.setDate(cursor.getDate() + 1)
      ) {
        const iso = cursor.toISOString().split("T")[0]
        if (!map[iso]) {
          map[iso] = []
        }
        map[iso].push(event)
      }
    })

    return map
  }, [filteredLeaves])

  const publicHolidayCount = useMemo(() => {
    return resolvedHolidays.filter((holiday) =>
      holiday.type === "PUBLIC" && holiday.date.startsWith(String(year))
    ).length
  }, [resolvedHolidays, year])

  const optionalHolidayCount = useMemo(() => {
    return resolvedHolidays.filter((holiday) =>
      holiday.type === "OPTIONAL" && holiday.date.startsWith(String(year))
    ).length
  }, [resolvedHolidays, year])

  const combinedList = useMemo(() => {
    const items: CombinedItem[] = []

    holidayList.forEach((holiday) => {
      items.push({
        id: holiday.id,
        kind: "HOLIDAY",
        date: holiday.date,
        title: holiday.name,
        subtitle: holiday.description,
        badge: holiday.type === "PUBLIC" ? "Public Holiday" : "Optional Holiday",
        badgeStyle:
          holiday.type === "PUBLIC"
            ? badgeStyles.holidayPublic
            : badgeStyles.holidayOptional,
        raw: holiday
      })
    })

    filteredLeaves.forEach((leave) => {
      items.push({
        id: leave.id,
        kind: "LEAVE",
        date: leave.start_date,
        title: `${leave.employee_name} on leave`,
        subtitle: `${leave.start_date} to ${leave.end_date}`,
        badge: leave.leave_type || "Leave",
        badgeStyle: badgeStyles.leave,
        raw: leave
      })
    })

    return items.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [holidayList, filteredLeaves])

  const upcomingItems = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return combinedList.filter((item) => {
      const itemDate = new Date(item.date)
      itemDate.setHours(0, 0, 0, 0)
      return itemDate >= today
    })
  }, [combinedList])

  const employeesOnLeaveToday = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return filteredLeaves.filter((leave) => {
      const start = new Date(leave.start_date)
      const end = new Date(leave.end_date)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)

      return start <= today && end >= today
    }).length
  }, [filteredLeaves])

  const upcomingHolidayCount = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const horizon = new Date(today)
    horizon.setDate(horizon.getDate() + 30)

    return holidayList.filter((holiday) => {
      const dateValue = new Date(holiday.date)
      return dateValue >= today && dateValue <= horizon
    }).length
  }, [holidayList])

  const todaysItems = useMemo(() => {
    return combinedList.filter((item) => {
      if (item.kind === "LEAVE") {
        const leave = item.raw as LeaveEvent
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = new Date(leave.start_date)
        const end = new Date(leave.end_date)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        return start <= today && end >= today
      }

      return item.date.startsWith(todayIso)
    })
  }, [combinedList, todayIso])

  const reminderItems = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const horizon = new Date(today)
    horizon.setDate(horizon.getDate() + 14)

    const reminders: CombinedItem[] = []

    holidayList.forEach((holiday) => {
      const dateValue = new Date(holiday.date)
      if (dateValue >= today && dateValue <= horizon) {
        reminders.push({
          id: `${holiday.id}-reminder`,
          kind: "HOLIDAY",
          date: holiday.date,
          title: holiday.name,
          subtitle: holiday.description,
          badge: holiday.type === "PUBLIC" ? "Public Holiday" : "Optional Holiday",
          badgeStyle:
            holiday.type === "PUBLIC"
              ? badgeStyles.holidayPublic
              : badgeStyles.holidayOptional,
          raw: holiday
        })
      }
    })

    filteredLeaves.forEach((leave) => {
      const startDate = new Date(leave.start_date)
      const endDate = new Date(leave.end_date)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)

      if (startDate >= today && startDate <= horizon) {
        reminders.push({
          id: `${leave.id}-start`,
          kind: "LEAVE",
          date: leave.start_date,
          title: `${leave.employee_name} leave starts`,
          subtitle: leave.leave_type || "Leave",
          badge: leave.leave_type || "Leave",
          badgeStyle: badgeStyles.leave,
          raw: leave
        })
      }

      if (endDate >= today && endDate <= horizon) {
        reminders.push({
          id: `${leave.id}-end`,
          kind: "LEAVE",
          date: leave.end_date,
          title: `${leave.employee_name} leave ends`,
          subtitle: leave.leave_type || "Leave",
          badge: leave.leave_type || "Leave",
          badgeStyle: badgeStyles.leave,
          raw: leave
        })
      }
    })

    return reminders.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [holidayList, filteredLeaves])

  const getDaysForMonth = (yearValue: number, monthValue: number) => {
    const firstDay = new Date(yearValue, monthValue, 1)
    const lastDay = new Date(yearValue, monthValue + 1, 0)

    const days: Array<{ day: number; iso: string | null }> = []

    const startWeekDay = firstDay.getDay()

    for (let i = 0; i < startWeekDay; i++) {
      days.push({ day: 0, iso: null })
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const iso = formatLocalDate(new Date(yearValue, monthValue, day))
      days.push({ day, iso })
    }

    while (days.length % 7 !== 0) {
      days.push({ day: 0, iso: null })
    }

    return days
  }

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-slate-100"

    if (status.includes("APPROVED")) {
      return "bg-green-200"
    }

    if (status.includes("PENDING")) {
      return "bg-yellow-200"
    }

    if (status.includes("REJECTED")) {
      return "bg-red-200"
    }

    return "bg-blue-200"
  }

  const handleItemClick = (item: CombinedItem) => {
    if (item.kind === "LEAVE") {
      setSelectedLeave(item.raw as LeaveEvent)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Company Calendar {year}</h1>
              <p className="text-gray-500 mt-1">
                Organization holidays, leaves, and events in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setYear((previous) => previous - 1)}
                className="px-4 py-2 border rounded-lg"
              >
                &larr; {year - 1}
              </button>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-4 py-2 border rounded-lg"
              >
                {Array.from({ length: 5 }, (_, index) => {
                  const currentYear = new Date().getFullYear() - 2 + index
                  return (
                    <option key={currentYear} value={currentYear}>
                      {currentYear}
                    </option>
                  )
                })}
              </select>
              <button
                onClick={() => setYear((previous) => previous + 1)}
                className="px-4 py-2 border rounded-lg"
              >
                {year + 1} &rarr;
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { key: "YEAR", label: "Yearly" },
                { key: "MONTH", label: "Monthly" },
                { key: "UPCOMING", label: "Upcoming" }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setView(item.key as CalendarView)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    view === item.key
                      ? "bg-slate-900 text-white border-slate-900"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search holidays, leaves, events"
                className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <button
                type="button"
                onClick={() => setHighlightToday((value) => !value)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                  highlightToday
                    ? "bg-sky-50 border-sky-200 text-sky-600"
                    : "bg-white text-gray-500"
                }`}
              >
                <span className="inline-flex w-2.5 h-2.5 rounded-full bg-sky-400" />
                Today
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPublicHolidays((value) => !value)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                showPublicHolidays
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-white text-gray-500"
              }`}
            >
              <span className={`inline-flex w-2.5 h-2.5 rounded-full ${dotStyles.holidayPublic}`} />
              Public Holidays ({publicHolidayCount})
            </button>

            <button
              type="button"
              onClick={() => setShowOptionalHolidays((value) => !value)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                showOptionalHolidays
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-white text-gray-500"
              }`}
            >
              <span className={`inline-flex w-2.5 h-2.5 rounded-full ${dotStyles.holidayOptional}`} />
              Optional Holidays ({optionalHolidayCount})
            </button>

            <button
              type="button"
              onClick={() => setShowLeaves((value) => !value)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                showLeaves
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-white text-gray-500"
              }`}
            >
              <span className={`inline-flex w-2.5 h-2.5 rounded-full ${dotStyles.leave}`} />
              Approved Leaves
            </button>

          </div>
        </div>
      </div>

      {error && <InlineNotice message={error} variant="error" />}
      {success && <InlineNotice message={success} variant="success" />}

      {loading && (
        <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-gray-500">
          Loading calendar data...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Public Holidays</p>
          <p className="text-2xl font-semibold text-rose-500 mt-2">{publicHolidayCount}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Optional Holidays</p>
          <p className="text-2xl font-semibold text-amber-500 mt-2">{optionalHolidayCount}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Employees on Leave</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-2">
            {employeesOnLeaveToday}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Upcoming Holidays</p>
          <p className="text-2xl font-semibold text-rose-500 mt-2">
            {upcomingHolidayCount}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today's Items</p>
          <p className="text-2xl font-semibold text-slate-700 mt-2">
            {todaysItems.length}
          </p>
        </div>
      </div>

      {reminderItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Reminders</h2>
            <span className="text-sm text-gray-500">Next 14 days</span>
          </div>
          <div className="space-y-2">
            {reminderItems.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="w-full text-left border rounded-lg p-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-800">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.badgeStyle}`}>
                    {item.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {upcomingItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 px-4 py-3 rounded-xl">
          Upcoming: {upcomingItems.slice(0, 3).map((item) => item.title).join(" · ")}
        </div>
      )}

      {view === "MONTH" && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {new Date(year, monthIndex).toLocaleString(undefined, {
                month: "long",
                year: "numeric"
              })}
            </h2>
            <select
              value={monthIndex}
              onChange={(e) => setMonthIndex(Number(e.target.value))}
              className="border border-gray-300 p-2 rounded-lg"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {new Date(year, month).toLocaleString(undefined, { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div key={dayName} className="text-center text-gray-500">
                {dayName}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysForMonth(year, monthIndex).map((cell, index) => {
              const dayEvents = cell.iso ? eventMap[cell.iso] : undefined
              const dayHolidays = cell.iso ? holidayMap[cell.iso] : undefined
              const isToday = highlightToday && cell.iso === todayIso
              const hasHoliday = dayHolidays && dayHolidays.length > 0

              const background =
                hasHoliday
                  ? dayHolidays[0].type === "PUBLIC"
                    ? "bg-rose-50"
                    : "bg-amber-50"
                  : dayEvents && dayEvents.length > 0
                  ? getStatusColor(dayEvents[0].status)
                  : "bg-white"

              return (
                <div
                  key={index}
                  className={`h-12 border rounded flex flex-col items-center justify-center ${background} ${
                    isToday ? "ring-2 ring-sky-400" : ""
                  }`}
                >
                  {cell.day !== 0 ? (
                    <>
                      <span>{cell.day}</span>
                      <div className="flex gap-1 mt-1">
                        {dayHolidays?.slice(0, 2).map((holiday) => (
                          <span
                            key={holiday.name}
                            className={`w-2 h-2 rounded-full ${
                              holiday.type === "PUBLIC"
                                ? dotStyles.holidayPublic
                                : dotStyles.holidayOptional
                            }`}
                          />
                        ))}
                        {dayEvents?.slice(0, 1).map((leave) => (
                          <span key={leave.id} className={`w-2 h-2 rounded-full ${dotStyles.leave}`} />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === "YEAR" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {months.map((month) => {
            const days = getDaysForMonth(year, month)

            return (
              <div key={month} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="bg-linear-to-r from-violet-500 to-indigo-500 text-white rounded-xl p-3 mb-3">
                  <h3 className="font-semibold">
                    {new Date(year, month).toLocaleString(undefined, {
                      month: "long",
                      year: "numeric"
                    })}
                  </h3>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                    <div key={dayName} className="text-center text-gray-500">
                      {dayName}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((cell, index) => {
                    const dayEvents = cell.iso ? eventMap[cell.iso] : undefined
                    const dayHolidays = cell.iso ? holidayMap[cell.iso] : undefined
                    const isToday = highlightToday && cell.iso === todayIso
                    const hasHoliday = dayHolidays && dayHolidays.length > 0

                    const background =
                      hasHoliday
                        ? dayHolidays[0].type === "PUBLIC"
                          ? "bg-rose-50"
                          : "bg-amber-50"
                        : dayEvents && dayEvents.length > 0
                        ? getStatusColor(dayEvents[0].status)
                        : "bg-white"

                    return (
                      <div
                        key={index}
                        className={`h-10 border rounded flex flex-col items-center justify-center ${background} ${
                          isToday ? "ring-2 ring-sky-400" : ""
                        }`}
                      >
                        {cell.day !== 0 ? (
                          <>
                            <span>{cell.day}</span>
                            <div className="flex gap-1 mt-1">
                              {dayHolidays?.slice(0, 2).map((holiday) => (
                                <span
                                  key={holiday.name}
                                  className={`w-2 h-2 rounded-full ${
                                    holiday.type === "PUBLIC"
                                      ? dotStyles.holidayPublic
                                      : dotStyles.holidayOptional
                                  }`}
                                />
                              ))}
                              {dayEvents?.slice(0, 1).map((leave) => (
                                <span key={leave.id} className={`w-2 h-2 rounded-full ${dotStyles.leave}`} />
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}


      {view === "UPCOMING" && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Upcoming</h2>
            <span className="text-sm text-gray-500">Next 30 items</span>
          </div>
          {upcomingItems.length === 0 ? (
            <p className="text-gray-500">No upcoming items.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingItems.slice(0, 30).map((item) => (
                <button
                  key={`${item.kind}-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className="w-full text-left border rounded-lg p-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.badgeStyle}`}>
                      {item.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Holiday List {year}</h2>
          <span className="text-sm text-gray-500">{holidayList.length} holidays</span>
        </div>
        {holidayList.length === 0 ? (
          <p className="text-gray-500">No holidays available.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {holidayList.map((holiday) => (
              <div
                key={holiday.id}
                className={`border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                  holiday.type === "PUBLIC"
                    ? "bg-rose-50 border-rose-100"
                    : "bg-amber-50 border-amber-100"
                }`}
              >
                <div>
                  <p className="text-sm text-gray-500">{holiday.date}</p>
                  <p className="font-medium text-gray-900">{holiday.name}</p>
                  <p className="text-sm text-gray-500">
                    {holiday.description || "No description"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      holiday.type === "PUBLIC"
                        ? badgeStyles.holidayPublic
                        : badgeStyles.holidayOptional
                    }`}
                  >
                    {holiday.type === "PUBLIC" ? "Public" : "Optional"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLeave && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Leave Details</h3>
              <button
                onClick={() => setSelectedLeave(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Employee</span>
                <span className="font-medium text-gray-800">{selectedLeave.employee_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Leave Type</span>
                <span className="font-medium text-gray-800">{selectedLeave.leave_type || "Leave"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span className="font-medium text-gray-800">
                  {selectedLeave.start_date} to {selectedLeave.end_date}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-medium text-gray-800">{selectedLeave.status}</span>
              </div>
              <div>
                <p className="text-gray-500">Reason</p>
                <p className="text-gray-800">{selectedLeave.reason || "No reason provided"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarPage
