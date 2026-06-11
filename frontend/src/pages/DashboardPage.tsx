import { useEffect, useMemo, useState } from "react"
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

import {
  getDashboardStats
} from "../services/dashboardService"
import { listMyLeaves } from "../services/leaveService"

type DepartmentDistribution = {
  department: string
  count: number
}

type RecentActivity = {
  employee_id: string
  actor_id: string
  action: string
  old_state: string
  new_state: string
  reason: string
  created_at: string
}

type DashboardStats = {
  total_employees: number
  active_employees: number
  onboarding_employees: number
  on_leave_employees: number
  suspended_employees: number
  offboarded_employees: number
  department_distribution: DepartmentDistribution[]
  recent_activities: RecentActivity[]
}

type LeaveItem = {
  id: string
  start_date: string
  end_date: string
  reason: string
  leave_type?: string
  status: string
  decision_note?: string
  created_at: string
}

function DashboardPage() {

  const [stats, setStats] =
    useState<DashboardStats | null>(null)

  const [myLeaves, setMyLeaves] =
    useState<LeaveItem[]>([])

  const [myLeavesLoading, setMyLeavesLoading] =
    useState(false)

  const role = localStorage.getItem(
    "user_role"
  )

  const username =
    localStorage.getItem(
      "username"
    )

  const isRoleReady = Boolean(role)

  const isEmployee = role === "EMPLOYEE"

  const showAdminHrView =
    role === "ADMIN" ||
    role === "HR_MANAGER"

  const fetchStats = async () => {

    try {

      const data =
        await getDashboardStats()

      setStats(data)

    } catch (error) {

      console.log(error)
    }
  }

  const fetchMyLeaves = async () => {

    if (!isEmployee) {
      return
    }

    try {

      setMyLeavesLoading(true)

      const data = await listMyLeaves({
        page: 1,
        limit: 2000
      })

      setMyLeaves(data.items || [])

    } catch (error) {

      console.log(error)

    } finally {

      setMyLeavesLoading(false)
    }
  }

  useEffect(() => {

    if (showAdminHrView) {
      fetchStats()
    }

    if (isEmployee) {
      fetchMyLeaves()
    }

  }, [isEmployee, showAdminHrView])

  const isLoading =
    (showAdminHrView && !stats) ||
    (isEmployee && myLeavesLoading)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const employeeSummary = useMemo(() => {
    const approved = myLeaves.filter(
      (leave) => leave.status === "APPROVED"
    )

    const pending = myLeaves.filter(
      (leave) => leave.status === "PENDING"
    )

    const upcoming = approved
      .filter((leave) => {
        const start = new Date(leave.start_date)
        start.setHours(0, 0, 0, 0)
        return start >= today
      })
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() -
          new Date(b.start_date).getTime()
      )

    const totalApprovedDays = approved.reduce(
      (sum, leave) => {
        const start = new Date(leave.start_date)
        const end = new Date(leave.end_date)
        const days =
          Math.ceil(
            (end.getTime() - start.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        return sum + Math.max(days, 0)
      },
      0
    )

    const recent = [...myLeaves]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, 5)

    return {
      approved,
      pending,
      upcoming,
      totalApprovedDays,
      recent
    }
  }, [myLeaves])

  const departmentTotal =
    stats?.department_distribution.reduce(
      (sum, item) => sum + item.count,
      0
    ) || 0

  const pieColors = [
    "#0ea5e9",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6"
  ]

  const departmentChart = (stats?.department_distribution || []).map(
    (item, index) => {
      const percent = departmentTotal
        ? (item.count / departmentTotal) * 100
        : 0

      return {
        ...item,
        percent,
        color: pieColors[index % pieColors.length]
      }
    }
  )

  return (

    <div>

      {!isRoleReady && (

        <div className="text-2xl font-semibold">

          Loading Dashboard...

        </div>
      )}

      {isLoading && (

        <div className="text-2xl font-semibold">

          Loading Dashboard...

        </div>
      )}

      {!isLoading && isEmployee && (

        <>

          <div className="rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-8 mb-8">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>

                <p className="uppercase tracking-[0.25em] text-xs text-slate-300">

                  My Workspace

                </p>

                <p className="text-sm text-slate-300 mt-2">

                  Welcome, {username || "Employee"} ({role || "Employee"})

                </p>

                <h1 className="text-3xl md:text-4xl font-display mt-3">

                  Employee Dashboard

                </h1>

                <p className="text-slate-300 mt-3 max-w-xl">

                  Track your leave requests, approvals, and upcoming time off.

                </p>

              </div>

              <div className="bg-white/10 rounded-2xl p-6 border border-white/10">

                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">

                  Upcoming Leave

                </p>

                {employeeSummary.upcoming.length > 0 ? (

                  <>

                    <p className="text-2xl font-semibold mt-3">

                      {employeeSummary.upcoming[0].start_date}

                    </p>

                    <p className="text-sm text-slate-300 mt-2">

                      {employeeSummary.upcoming[0].leave_type || "SICK"}

                    </p>

                  </>

                ) : (

                  <p className="text-sm text-slate-300 mt-3">

                    No upcoming leaves

                  </p>
                )}

              </div>

            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

              <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">

                Pending Requests

              </h2>

              <p className="text-3xl font-semibold mt-3 text-amber-600">

                {employeeSummary.pending.length}

              </p>

            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

              <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">

                Approved Leaves

              </h2>

              <p className="text-3xl font-semibold mt-3 text-emerald-600">

                {employeeSummary.approved.length}

              </p>

            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

              <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">

                Approved Days

              </h2>

              <p className="text-3xl font-semibold mt-3 text-sky-600">

                {employeeSummary.totalApprovedDays}

              </p>

            </div>

          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-semibold text-gray-800">

                Recent Leave Requests

              </h2>

              <span className="text-sm text-slate-500">

                Latest 5 requests

              </span>

            </div>

            {employeeSummary.recent.length === 0 && (

              <div className="text-gray-500 text-sm">

                No leave requests yet.

              </div>
            )}

            {employeeSummary.recent.length > 0 && (

              <div className="space-y-4">

                {employeeSummary.recent.map((leave) => (

                  <div
                    key={leave.id}
                    className="border border-slate-100 rounded-xl p-4"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div>

                        <p className="font-medium text-gray-800">

                          {leave.start_date} to {leave.end_date}

                        </p>

                        <p className="text-sm text-slate-500">

                          {leave.reason}

                        </p>

                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${leave.status === "APPROVED" ? "bg-green-100 text-green-700" : leave.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>

                        {leave.status}

                      </span>

                    </div>

                    {leave.decision_note && (

                      <p className="text-xs text-slate-500 mt-2">

                        Decision: {leave.decision_note}

                      </p>
                    )}

                  </div>
                ))}

              </div>
            )}

          </div>


          {showAdminHrView && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-semibold mb-4">Department Distribution</h3>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={departmentChart} dataKey="count" nameKey="department" outerRadius={80} label>
                        {departmentChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-semibold mb-4">Employee States</h3>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={[{ name: 'Active', value: stats.active_employees }, { name: 'On Leave', value: stats.on_leave_employees }, { name: 'Suspended', value: stats.suspended_employees }, { name: 'Offboarded', value: stats.offboarded_employees }, { name: 'Onboarding', value: stats.onboarding_employees }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ReTooltip />
                      <Bar dataKey="value" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
                <div className="text-sm text-gray-600 max-h-56 overflow-y-auto">
                  {stats.recent_activities.map((act) => (
                    <div key={act.created_at} className="mb-3">
                      <div className="font-medium">{act.action} — {act.actor_id}</div>
                      <div className="text-xs text-gray-500">{act.created_at}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!isLoading && !isEmployee && stats && (

      <>

      <div className="rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-8 mb-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div>

            <p className="uppercase tracking-[0.25em] text-xs text-slate-300">

              Workforce Overview

            </p>

            <h1 className="text-3xl md:text-4xl font-display mt-3">

              HRMS Command Center

            </h1>

            <p className="text-slate-300 mt-3 max-w-xl">

              Monitor onboarding, active workforce, and critical lifecycle transitions in one place.

            </p>

          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/10">

            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">

              Total Employees

            </p>

            <p className="text-3xl font-semibold mt-3">

              {stats.total_employees}

            </p>

            <p className="text-sm text-slate-300 mt-2">

              {stats.active_employees} active right now

            </p>

          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

          <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">

            Active Employees

          </h2>

          <p className="text-3xl font-semibold mt-3 text-emerald-600">

            {stats.active_employees}

          </p>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

          <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">

            On Leave

          </h2>

          <p className="text-3xl font-semibold mt-3 text-amber-600">

            {stats.on_leave_employees}

          </p>

          <p className="text-sm text-slate-500 mt-2">

            Scheduled away

          </p>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

          <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">

            Onboarding

          </h2>

          <p className="text-3xl font-semibold mt-3 text-sky-600">

            {stats.onboarding_employees}

          </p>

          <p className="text-sm text-slate-500 mt-2">

            Talent pipeline

          </p>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

          <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">

            Suspended

          </h2>

          <p className="text-3xl font-semibold mt-3 text-rose-500">

            {stats.suspended_employees}

          </p>

          <p className="text-sm text-slate-500 mt-2">

            Requires review

          </p>

        </div>

      </div>

      {showAdminHrView && (

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">

          <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-semibold text-gray-800">

                Department Distribution

              </h2>

              <span className="text-sm text-slate-500">

                Employees by department

              </span>

            </div>

            {departmentChart.length === 0 && (

              <div className="text-gray-500 text-sm">

                No department data yet.

              </div>
            )}

            {departmentChart.length > 0 && (

              <div className="flex flex-col md:flex-row md:items-center gap-6">

                <div className="w-48 h-48">
                  <svg viewBox="0 0 42 42" className="w-full h-full">
                    {departmentChart.reduce(
                      (segments, item) => {
                        const previous = segments.total
                        const strokeDasharray = `${item.percent} ${100 - item.percent}`
                        const strokeDashoffset = 25 - previous

                        segments.nodes.push(
                          <circle
                            key={item.department}
                            r="15.9"
                            cx="21"
                            cy="21"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="8"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                          />
                        )

                        segments.total += item.percent
                        return segments
                      },
                      {
                        total: 0,
                        nodes: [] as React.ReactNode[]
                      }
                    ).nodes}
                  </svg>
                </div>

                <div className="flex-1 space-y-3">
                  {departmentChart.map((item) => (
                    <div
                      key={item.department}
                      className="flex items-center justify-between text-sm text-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.department}</span>
                      </div>
                      <span>
                        {item.count} ({Math.round(item.percent)}%)
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-xl font-semibold text-gray-800">

                Recent Activities

              </h2>

              <span className="text-sm text-slate-500">

                Latest changes

              </span>

            </div>

            <div className="max-h-105 overflow-y-auto pr-2 space-y-4">

              {stats.recent_activities.length === 0 && (

                <div className="text-gray-500 text-sm">

                  No recent activity yet.

                </div>
              )}

              {stats.recent_activities.map((activity) => (

                <div
                  key={`${activity.employee_id}-${activity.created_at}`}
                  className="border border-slate-100 rounded-xl p-4"
                >

                  <p className="text-sm text-slate-600">

                    {activity.action} - {activity.old_state} to {activity.new_state}

                  </p>

                  <p className="text-xs text-slate-400 mt-1">

                    {new Date(activity.created_at).toLocaleString()}

                  </p>

                  {activity.reason && (

                    <p className="text-xs text-slate-500 mt-2">

                      {activity.reason}

                    </p>
                  )}

                </div>
              ))}

            </div>

          </div>

        </div>
      )}

      {!showAdminHrView && (

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8">

          <h2 className="text-xl font-semibold text-gray-800">

            Employee Snapshot

          </h2>

          <p className="text-sm text-slate-500 mt-2">

            Company-wide overview based on your access.

          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">

            <div className="border border-slate-100 rounded-xl p-4">

              <p className="text-sm text-gray-500">

                Onboarding

              </p>

              <p className="text-2xl font-semibold text-blue-600 mt-2">

                {stats.onboarding_employees}

              </p>

            </div>

            <div className="border border-slate-100 rounded-xl p-4">

              <p className="text-sm text-gray-500">

                Offboarded

              </p>

              <p className="text-2xl font-semibold text-red-500 mt-2">

                {stats.offboarded_employees}

              </p>

            </div>

            <div className="border border-slate-100 rounded-xl p-4">

              <p className="text-sm text-gray-500">

                Active

              </p>

              <p className="text-2xl font-semibold text-green-600 mt-2">

                {stats.active_employees}

              </p>

            </div>

          </div>

        </div>
      )}

      </>

      )}

    </div>
  )
}

export default DashboardPage