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
  const [year, setYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await getCalendarEvents(year)
        if (!mounted) return
        setEvents(res.events || [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
    return () => { mounted = false }
  }, [year])

  // Map events to a lookup of yyyy-mm-dd -> array of events
  const eventMap = useMemo(() => {
    const map: Record<string, EventItem[]> = {}

    const addToMap = (dateStr: string, ev: EventItem) => {
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(ev)
    }

    events.forEach((ev) => {
      try {
        const s = new Date(ev.start_date)
        const e = new Date(ev.end_date)
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          const iso = d.toISOString().slice(0, 10)
          addToMap(iso, ev)
        }
      } catch (err) {
        // ignore parse errors
      }
    })

    return map
  }, [events])

  const months = Array.from({ length: 12 }).map((_, i) => i)

  const getDaysForMonth = (y: number, m: number) => {
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const days: Array<{ d: number; iso: string | null }> = []
    const startWeek = first.getDay()
    // fill blanks for week start
    for (let i = 0; i < startWeek; i++) days.push({ d: 0, iso: null })
    for (let day = 1; day <= last.getDate(); day++) {
      const iso = new Date(y, m, day).toISOString().slice(0, 10)
      days.push({ d: day, iso })
    }
    // pad to complete rows (optional)
    while (days.length % 7 !== 0) days.push({ d: 0, iso: null })
    return days
  }

  const statusColor = (status: string | undefined) => {
    if (!status) return "bg-slate-200"
    if (String(status).includes("APPROVED")) return "bg-blue-200"
    if (String(status).includes("PENDING")) return "bg-amber-200"
    if (String(status).includes("REJECTED")) return "bg-rose-200"
    return "bg-slate-200"
  }

  return (
    <div>

      <div className="rounded-2xl bg-white p-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Company Calendar {year}</h1>
          <p className="text-sm text-slate-500 mt-1">Organization leave calendar (birthdays hidden)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="px-3 py-2 border rounded-lg"
          >
            ← {year - 1}
          </button>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - 2 + i
              return (
                <option key={y} value={y}>{y}</option>
              )
            })}
          </select>

          <button
            onClick={() => setYear((y) => y + 1)}
            className="px-3 py-2 border rounded-lg"
          >
            {year + 1} →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {months.map((m) => {
          const days = getDaysForMonth(year, m)
          return (
            <div key={m} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-t-lg p-3 mb-3">
                <h3 className="text-sm font-semibold">{new Date(year, m).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h3>
              </div>

              <div className="grid grid-cols-7 gap-1 text-xs mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                  <div key={d} className="text-center text-[10px] text-slate-500">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((cell, idx) => {
                  const dayEvents = cell.iso ? eventMap[cell.iso] : undefined
                  const bg = dayEvents && dayEvents.length > 0 ? statusColor(dayEvents[0].status) : 'bg-white'
                  return (
                    <div key={idx} className={`h-10 border rounded flex flex-col items-center justify-center ${bg}`}>
                      {cell.d !== 0 ? (
                        <>
                          <div className="text-sm">{cell.d}</div>
                          <div className="flex gap-1 mt-1">
                            {dayEvents && dayEvents.slice(0,3).map((ev) => (
                              <span key={ev.id} className="w-2 h-2 rounded-full bg-emerald-500" />
                            ))}
                          </div>
                        </>
                      ) : <div />}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Leave Events</h2>
        {events.length === 0 ? (
          <div className="text-sm text-slate-500">No leave events found.</div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {events.map((ev) => (
              <div key={ev.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{ev.employee_name}</div>
                    <div className="text-xs text-slate-500">{ev.start_date} → {ev.end_date}</div>
                  </div>
                  <div className="text-sm text-slate-600">{ev.status}</div>
                </div>
                {ev.reason && (
                  <p className="text-xs text-slate-500 mt-2">{ev.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default CalendarPage
