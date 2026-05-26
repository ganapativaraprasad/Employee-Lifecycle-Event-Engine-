import { useEffect, useState, useMemo } from "react"
import { getCalendarEvents } from "../services/calendarService"

type EventItem = {
  id: string
  employee_name: string
  start_date: string
  end_date: string
  status: string
  reason?: string
}

function CalendarPage() {

  const [events, setEvents] = useState<EventItem[]>([])

  const [year, setYear] = useState<number>(
    new Date().getFullYear()
  )

  useEffect(() => {

    let mounted = true

    const loadEvents = async () => {

      try {

        const response =
          await getCalendarEvents(year)

        if (!mounted) return

        setEvents(
          response?.events || []
        )

      } catch (error: any) {

        console.error(error)
      }
    }

    loadEvents()

    return () => {

      mounted = false
    }

  }, [year])

  const eventMap = useMemo(() => {

    const map: Record<
      string,
      EventItem[]
    > = {}

    events.forEach((event) => {

      const startDate =
        new Date(event.start_date)

      const endDate =
        new Date(event.end_date)

      const currentDate =
        new Date(startDate)

      while (
        currentDate <= endDate
      ) {

        const isoDate =
          currentDate
            .toISOString()
            .split("T")[0]

        if (!map[isoDate]) {

          map[isoDate] = []
        }

        map[isoDate].push(event)

        currentDate.setDate(
          currentDate.getDate() + 1
        )
      }
    })

    return map

  }, [events])

  const months =
    Array.from(
      { length: 12 },
      (_, index) => index
    )

  const getDaysForMonth = (
    year: number,
    month: number
  ) => {

    const firstDay =
      new Date(year, month, 1)

    const lastDay =
      new Date(year, month + 1, 0)

    const days: Array<{
      day: number
      iso: string | null
    }> = []

    const startWeekDay =
      firstDay.getDay()

    for (
      let i = 0;
      i < startWeekDay;
      i++
    ) {

      days.push({
        day: 0,
        iso: null
      })
    }

    for (
      let day = 1;
      day <= lastDay.getDate();
      day++
    ) {

      const iso =
        new Date(
          year,
          month,
          day
        )
          .toISOString()
          .split("T")[0]

      days.push({
        day,
        iso
      })
    }

    while (
      days.length % 7 !== 0
    ) {

      days.push({
        day: 0,
        iso: null
      })
    }

    return days
  }

  const getStatusColor = (
    status?: string
  ) => {

    if (!status)
      return "bg-slate-100"

    if (
      status.includes(
        "APPROVED"
      )
    ) {
      return "bg-green-200"
    }

    if (
      status.includes(
        "PENDING"
      )
    ) {
      return "bg-yellow-200"
    }

    if (
      status.includes(
        "REJECTED"
      )
    ) {
      return "bg-red-200"
    }

    return "bg-blue-200"
  }

  return (

    <div>

      {/* Header */}

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold">

            Company Calendar {year}

          </h1>

          <p className="text-gray-500 mt-1">

            Organization Leave Calendar

          </p>

        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={() =>
              setYear(
                (previous) =>
                  previous - 1
              )
            }
            className="px-4 py-2 border rounded-lg"
          >

            ← Previous

          </button>

          <select
            value={year}
            onChange={(e) =>
              setYear(
                Number(
                  e.target.value
                )
              )
            }
            className="px-4 py-2 border rounded-lg"
          >

            {Array.from(
              { length: 5 },
              (_, index) => {

                const currentYear =
                  new Date()
                    .getFullYear() -
                  2 +
                  index

                return (

                  <option
                    key={currentYear}
                    value={currentYear}
                  >

                    {currentYear}

                  </option>
                )
              }
            )}

          </select>

          <button
            onClick={() =>
              setYear(
                (previous) =>
                  previous + 1
              )
            }
            className="px-4 py-2 border rounded-lg"
          >

            Next →

          </button>

        </div>

      </div>

      {/* Calendar */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {months.map(
          (month) => {

            const days =
              getDaysForMonth(
                year,
                month
              )

            return (

              <div
                key={month}
                className="bg-white rounded-2xl shadow-sm p-4"
              >

                <div className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl p-3 mb-3">

                  <h3 className="font-semibold">

                    {
                      new Date(
                        year,
                        month
                      ).toLocaleString(
                        undefined,
                        {
                          month:
                            "long",
                          year:
                            "numeric"
                        }
                      )
                    }

                  </h3>

                </div>

                <div className="grid grid-cols-7 gap-1 text-xs mb-2">

                  {[
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat"
                  ].map(
                    (dayName) => (

                      <div
                        key={dayName}
                        className="text-center text-gray-500"
                      >

                        {dayName}

                      </div>
                    )
                  )}

                </div>

                <div className="grid grid-cols-7 gap-1">

                  {days.map(
                    (
                      cell,
                      index
                    ) => {

                      const dayEvents =
                        cell.iso
                          ? eventMap[
                              cell.iso
                            ]
                          : undefined

                      const background =
                        dayEvents &&
                        dayEvents.length >
                          0
                          ? getStatusColor(
                              dayEvents[0]
                                .status
                            )
                          : "bg-white"

                      return (

                        <div
                          key={index}
                          className={`h-10 border rounded flex flex-col items-center justify-center ${background}`}
                        >

                          {cell.day !==
                          0 ? (

                            <>
                              <span>

                                {
                                  cell.day
                                }

                              </span>

                              <div className="flex gap-1 mt-1">

                                {dayEvents
                                  ?.slice(
                                    0,
                                    3
                                  )
                                  .map(
                                    (
                                      event
                                    ) => (

                                      <span
                                        key={
                                          event.id
                                        }
                                        className="w-2 h-2 rounded-full bg-emerald-500"
                                      />
                                    )
                                  )}

                              </div>
                            </>

                          ) : null}

                        </div>
                      )
                    }
                  )}

                </div>

              </div>
            )
          }
        )}

      </div>

      {/* Events */}

      <div className="mt-6 bg-white rounded-2xl shadow-sm p-4">

        <h2 className="text-xl font-semibold mb-4">

          Leave Events

        </h2>

        {events.length === 0 ? (

          <p className="text-gray-500">

            No leave events found.

          </p>

        ) : (

          <div className="space-y-3 max-h-80 overflow-y-auto">

            {events.map(
              (event) => (

                <div
                  key={event.id}
                  className="border rounded-lg p-3"
                >

                  <div className="flex justify-between">

                    <div>

                      <p className="font-medium">

                        {
                          event.employee_name
                        }

                      </p>

                      <p className="text-sm text-gray-500">

                        {
                          event.start_date
                        }
                        {" → "}
                        {
                          event.end_date
                        }

                      </p>

                    </div>

                    <span className="text-sm text-gray-600">

                      {
                        event.status
                      }

                    </span>

                  </div>

                  {event.reason && (

                    <p className="text-sm text-gray-500 mt-2">

                      {
                        event.reason
                      }

                    </p>
                  )}

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  )
}

export default CalendarPage