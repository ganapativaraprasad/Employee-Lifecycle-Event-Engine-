import { useEffect, useState } from "react"

import {
  getDashboardStats
} from "../services/dashboardService"

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

function DashboardPage() {

  const [stats, setStats] =
    useState<DashboardStats | null>(null)

  const role = localStorage.getItem(
    "user_role"
  )

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

  useEffect(() => {

    fetchStats()

  }, [])

  if (!stats) {

    return (

      <div className="text-2xl font-semibold">

        Loading Dashboard...

      </div>
    )
  }

  return (

    <div>

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

            <div className="space-y-4">

              {stats.department_distribution.length === 0 && (

                <div className="text-gray-500 text-sm">

                  No department data yet.

                </div>
              )}

              {stats.department_distribution.map((item) => {

                const percent = stats.total_employees
                  ? Math.round((item.count / stats.total_employees) * 100)
                  : 0

                return (

                  <div key={item.department}>

                    <div className="flex justify-between text-sm text-gray-600 mb-2">

                      <span>

                        {item.department}

                      </span>

                      <span>

                        {item.count} ({percent}%)

                      </span>

                    </div>

                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">

                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${percent}%` }}
                      />

                    </div>

                  </div>
                )
              })}

            </div>

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

    </div>
  )
}

export default DashboardPage