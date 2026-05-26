import { useEffect, useMemo, useState } from "react"

import {
  applyLeave,
  approveLeave,
  getLeaveStats,
  listLeaves,
  listMyLeaves,
  rejectLeave
} from "../services/leaveService"
import { listEmployees } from "../services/employeeService"
import InlineNotice from "../components/InlineNotice"

type LeaveItem = {
  id: string
  employee_id: string
  employee_email: string
  employee_name: string
  start_date: string
  end_date: string
  reason: string
  leave_type?: string
  status: string
  requested_by: string
  approved_by?: string
  approved_at?: string
  decision_note?: string
  created_at: string
}

type LeaveListResponse = {
  items: LeaveItem[]
  total: number
  page: number
  limit: number
}

type Employee = {
  id: string
  first_name: string
  last_name: string
  email: string
  current_state: string
}

function LeavePage() {

  const role = localStorage.getItem(
    "user_role"
  )

  const isAdmin = role === "ADMIN"
  const isHr = role === "HR_MANAGER"

  const [myLeaves, setMyLeaves] =
    useState<LeaveItem[]>([])

  const [allLeaves, setAllLeaves] = useState<LeaveItem[]>([])

  const [employees, setEmployees] = useState<Employee[]>([])

  const [teamLeaves, setTeamLeaves] =
    useState<LeaveItem[]>([])

  const [stats, setStats] =
    useState({ pending: 0, approved: 0, rejected: 0 })

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const [formData, setFormData] =
    useState({
      employee_id: "",
      start_date: "",
      end_date: "",
      reason: "",
      leave_type: "SICK"
    })

  const [decisionNote, setDecisionNote] =
    useState("")

  const canReview = useMemo(() =>
    isAdmin || isHr,
    [isAdmin, isHr]
  )

  const leaveSummaryByEmployee = useMemo(() => {
    const summary: Record<
      string,
      {
        total: number
        byType: Record<string, number>
      }
    > = {}

    allLeaves.forEach((leave) => {
      const key = leave.employee_id || leave.employee_email

      if (!key) {
        return
      }

      if (!summary[key]) {
        summary[key] = {
          total: 0,
          byType: {}
        }
      }

      const type = leave.leave_type || "SICK"

      summary[key].total += 1
      summary[key].byType[type] =
        (summary[key].byType[type] || 0) + 1
    })

    return summary
  }, [allLeaves])

  const upcomingLeaves = useMemo(() => {
    if (!isAdmin) {
      return [] as LeaveItem[]
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return allLeaves
      .filter((leave) => {
        if (leave.status !== "APPROVED") {
          return false
        }

        const start = new Date(leave.start_date)
        start.setHours(0, 0, 0, 0)

        return start >= today
      })
      .sort((a, b) =>
        new Date(a.start_date).getTime() -
        new Date(b.start_date).getTime()
      )
  }, [allLeaves, isAdmin])

  const pendingLeaves = useMemo(() => {
    if (!isAdmin) {
      return [] as LeaveItem[]
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return allLeaves
      .filter((leave) => {
        if (leave.status !== "PENDING") {
          return false
        }

        const end = new Date(leave.end_date)
        end.setHours(0, 0, 0, 0)

        return end >= today
      })
      .sort((a, b) =>
        new Date(a.start_date).getTime() -
        new Date(b.start_date).getTime()
      )
  }, [allLeaves, isAdmin])

  const fetchMyLeaves = async () => {

    try {

      const data: LeaveListResponse =
        await listMyLeaves({
          page: 1,
          limit: 1000
        })

      setMyLeaves(data.items)

    } catch (error) {

      console.log(error)
    }
  }

  const fetchTeamLeaves = async () => {

    if (!canReview) {
      return
    }

    try {

      const data: LeaveListResponse =
        await listLeaves({
          page: 1,
          limit: 10,
          status: "PENDING"
        })

      setTeamLeaves(data.items)

    } catch (error) {

      console.log(error)
    }
  }

  const fetchAllLeaves = async () => {
    try {
      const data: LeaveListResponse = await listLeaves({ page: 1, limit: 1000 })
      setAllLeaves(data.items)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchEmployees = async () => {
    try {
      const data = await listEmployees({ page: 1, limit: 1000 })
      setEmployees(data.items || [])
    } catch (err) {
      console.error(err)
    }
  }


  const fetchStats = async () => {

    if (!canReview) {
      return
    }

    try {

      const data = await getLeaveStats()

      setStats(data)

    } catch (error) {

      console.log(error)
    }
  }

  useEffect(() => {

    fetchMyLeaves()
    fetchTeamLeaves()
    fetchStats()

  }, [canReview])

  useEffect(() => {

    if (!isAdmin) {
      return
    }

    fetchAllLeaves()
    fetchEmployees()

  }, [isAdmin])

  const handleApplyLeave = async () => {

    try {

      setLoading(true)
      setError("")
      setSuccess("")

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)

      if (startDate < today || endDate < today) {
        setError("Leave dates must be today or later.")
        setLoading(false)
        return
      }

      if (endDate < startDate) {
        setError("End date must be on or after the start date.")
        setLoading(false)
        return
      }

      if (formData.leave_type === "PLANNED") {
        const minPlannedStart = new Date(today)
        minPlannedStart.setDate(minPlannedStart.getDate() + 7)

        if (startDate < minPlannedStart) {
          setError("Planned leave must be applied at least 7 days in advance.")
          setLoading(false)
          return
        }
      }

      await applyLeave({
        ...formData,
        employee_id: canReview
          ? formData.employee_id
          : undefined
      })

      setFormData({
        employee_id: "",
        start_date: "",
        end_date: "",
        reason: "",
        leave_type: "SICK"
      })

      await fetchMyLeaves()
      await fetchTeamLeaves()
      await fetchStats()

      setSuccess("Leave request submitted")

    } catch (error: any) {

      console.log(error)

      setError(
        error?.response?.data?.detail ||
        "Failed to apply leave"
      )

    } finally {

      setLoading(false)
    }
  }

    // compute balances (simple days count per leave_type)
    const balances = useMemo(() => {
      const map: Record<string, number> = {
        SICK: 0,
        PLANNED: 0,
        OPTIONAL: 0,
        LOP: 0,
        EARLY_LOGOUT: 0
      }

      myLeaves.forEach((l) => {
        try {
          const s = new Date(l.start_date)
          const e = new Date(l.end_date)
          const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
          const key = (l as any).leave_type || 'SICK'
          map[key] = (map[key] || 0) + diff
        } catch (err) {}
      })

      return map
    }, [myLeaves])

  const handleDecision = async (
    leaveId: string,
    decision: "approve" | "reject"
  ) => {

    try {

      setLoading(true)
      setError("")
      setSuccess("")

      if (decision === "approve") {
        await approveLeave(
          leaveId,
          { decision_note: decisionNote }
        )
      } else {
        await rejectLeave(
          leaveId,
          { decision_note: decisionNote }
        )
      }

      setDecisionNote("")

      setSuccess(
        decision === "approve"
          ? "Leave request approved"
          : "Leave request rejected"
      )

      await fetchMyLeaves()
      await fetchTeamLeaves()
      await fetchStats()

    } catch (error: any) {

      console.log(error)

      setError(
        error?.response?.data?.detail ||
        "Failed to update request"
      )

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className="animate-fade-in">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>

          <h1 className="text-3xl font-bold text-gray-800">

            Leave Management

          </h1>

          <p className="text-gray-500 mt-1">

            Apply, track, and approve leave requests.

          </p>

        </div>

        {isAdmin && (

          <div className="flex gap-4">

            <div className="bg-white rounded-2xl shadow-sm px-5 py-4">

              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-yellow-600">

                {stats.pending}

              </p>

            </div>

            <div className="bg-white rounded-2xl shadow-sm px-5 py-4">

              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-semibold text-green-600">

                {stats.approved}

              </p>

            </div>

            <div className="bg-white rounded-2xl shadow-sm px-5 py-4">

              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-semibold text-red-500">

                {stats.rejected}

              </p>

            </div>

          </div>
        )}

      </div>

      {!isAdmin && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-wider">Total Leave Balance</div>
                <div className="text-3xl font-semibold mt-2">{Object.values(balances).reduce((a,b)=>a+(b||0),0)} days</div>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/10 p-4 rounded-xl text-sm">
                  <div className="text-xs text-white/80">Sick</div>
                  <div className="text-xl font-semibold">{balances.SICK || 0} days</div>
                </div>
                <div className="bg-white/10 p-4 rounded-xl text-sm">
                  <div className="text-xs text-white/80">Planned</div>
                  <div className="text-xl font-semibold">{balances.PLANNED || 0} days</div>
                </div>
                <div className="bg-white/10 p-4 rounded-xl text-sm">
                  <div className="text-xs text-white/80">Optional</div>
                  <div className="text-xl font-semibold">{balances.OPTIONAL || 0} days</div>
                </div>
                <div className="bg-white/10 p-4 rounded-xl text-sm">
                  <div className="text-xs text-white/80">LOP</div>
                  <div className="text-xl font-semibold">{balances.LOP || 0} days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <InlineNotice message={error} variant="error" />

      <InlineNotice message={success} variant="success" />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {!isAdmin ? (
          <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply Leave</h2>

            <div className="space-y-4">

              {canReview && (
                <input
                  type="text"
                  placeholder="Employee ID (optional)"
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employee_id: e.target.value
                    })
                  }
                  className="w-full border border-gray-300 p-3 rounded-xl"
                />
              )}

              <input
                type="date"
                min={
                  formData.leave_type === "PLANNED"
                    ? new Date(
                        new Date().setDate(
                          new Date().getDate() + 7
                        )
                      )
                        .toISOString()
                        .split("T")[0]
                    : new Date()
                        .toISOString()
                        .split("T")[0]
                }
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="w-full border border-gray-300 p-3 rounded-xl"
              />

              <input
                type="date"
                min={formData.start_date || new Date().toISOString().split("T")[0]}
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                className="w-full border border-gray-300 p-3 rounded-xl"
              />

              <div>
                <label className="text-sm text-gray-600">Leave Type</label>
                <select
                  value={(formData as any).leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-xl"
                >
                  <option value="SICK">Sick Leave</option>
                  <option value="PLANNED">Planned Leave</option>
                  <option value="OPTIONAL">Optional Holiday</option>
                  <option value="LOP">Leave Without Pay (LOP)</option>
                  <option value="EARLY_LOGOUT">Early Logout</option>
                </select>
              </div>

              <textarea
                placeholder="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-xl min-h-30"
              />

            </div>

            <button
              onClick={handleApplyLeave}
              disabled={loading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition text-white text-sm px-4 py-2 rounded-lg shadow-md disabled:bg-blue-300"
            >
              {loading ? "Submitting..." : "Submit Leave"}
            </button>

          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upcoming Leaves
            </h2>

            {upcomingLeaves.length === 0 ? (
              <div className="text-sm text-gray-500">
                No upcoming approved leaves.
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {upcomingLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="border border-gray-100 rounded-xl p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {leave.employee_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {leave.start_date} to {leave.end_date}
                        </p>
                        <p className="text-sm text-gray-500">
                          {leave.reason}
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {leave.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="xl:col-span-2 space-y-6">

          {!isAdmin && (
            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-xl font-semibold text-gray-800">

                  My Leave Requests

                </h2>

                <span className="text-sm text-gray-500">

                  Latest 10 requests

                </span>

              </div>

              {myLeaves.length === 0 && (

                <div className="text-sm text-gray-500">

                  No leave requests yet.

                </div>
              )}

              {myLeaves.length > 0 && (

                <div className="space-y-4">

                  {myLeaves.map((leave) => (

                    <div
                      key={leave.id}
                      className="border border-gray-100 rounded-xl p-4"
                    >

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <div>

                          <p className="font-medium text-gray-800">

                            {leave.start_date} to {leave.end_date}

                          </p>

                          <p className="text-sm text-gray-500">

                            {leave.reason}

                          </p>

                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${leave.status === "APPROVED" ? "bg-green-100 text-green-700" : leave.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>

                          {leave.status}

                        </span>

                      </div>

                      {leave.decision_note && (

                        <p className="text-xs text-gray-500 mt-2">

                          Decision: {leave.decision_note}

                        </p>
                      )}

                    </div>
                  ))}

                </div>
              )}

            </div>
          )}

          {isAdmin ? (
            <div className="bg-white rounded-2xl shadow-md p-6">

              <div className="flex items-center justify-between mb-4">

                <h2 className="text-xl font-semibold text-gray-800">

                  Pending Leaves

                </h2>

                <span className="text-sm text-gray-500">

                  Upcoming decisions

                </span>

              </div>

              {pendingLeaves.length === 0 && (

                <div className="text-sm text-gray-500">

                  No pending leaves from today onward.

                </div>
              )}

              {pendingLeaves.length > 0 && (

                <div className="space-y-4">

                  {pendingLeaves.map((leave) => (

                    <div
                      key={leave.id}
                      className="border border-gray-100 rounded-xl p-4"
                    >

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <div>

                          <p className="font-medium text-gray-800">

                            {leave.employee_name} ({leave.employee_email})

                          </p>

                          <p className="text-sm text-gray-500">

                            {leave.start_date} to {leave.end_date}

                          </p>

                          <p className="text-sm text-gray-500">

                            {leave.reason}

                          </p>

                        </div>

                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">

                          {leave.status}

                        </span>

                      </div>

                    </div>
                  ))}

                </div>
              )}

            </div>
          ) : (
            canReview && (

              <div className="bg-white rounded-2xl shadow-md p-6">

                <div className="flex items-center justify-between mb-4">

                  <h2 className="text-xl font-semibold text-gray-800">

                    Pending Approvals

                  </h2>

                  <span className="text-sm text-gray-500">

                    Latest 10 requests

                  </span>

                </div>

                {teamLeaves.length === 0 && (

                  <div className="text-sm text-gray-500">

                    No pending requests.

                  </div>
                )}

                {teamLeaves.length > 0 && (

                  <div className="space-y-4">

                    {teamLeaves.map((leave) => (

                      <div
                        key={leave.id}
                        className="border border-gray-100 rounded-xl p-4"
                      >

                        <div className="flex flex-wrap items-center justify-between gap-3">

                          <div>

                            <p className="font-medium text-gray-800">

                              {leave.employee_name} ({leave.employee_email})

                            </p>

                            <p className="text-sm text-gray-500">

                              {leave.start_date} to {leave.end_date}

                            </p>

                            <p className="text-sm text-gray-500">

                              {leave.reason}

                            </p>

                          </div>

                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">

                            {leave.status}

                          </span>

                        </div>

                        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">

                          <input
                            type="text"
                            placeholder="Decision note (optional)"
                            value={decisionNote}
                            onChange={(e) =>
                              setDecisionNote(e.target.value)
                            }
                            className="flex-1 border border-gray-300 p-3 rounded-xl"
                          />

                          <div className="flex gap-3">

                            <button
                              onClick={() =>
                                handleDecision(
                                  leave.id,
                                  "approve"
                                )
                              }
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded-xl disabled:bg-green-300"
                            >

                              Approve

                            </button>

                            <button
                              onClick={() =>
                                handleDecision(
                                  leave.id,
                                  "reject"
                                )
                              }
                              disabled={loading}
                              className="bg-red-500 hover:bg-red-600 transition text-white px-4 py-2 rounded-xl disabled:bg-red-300"
                            >

                              Reject

                            </button>

                          </div>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

              </div>
            )
          )}

        </div>

      </div>

      {isAdmin && (
        <div className="mt-6 bg-white rounded-2xl shadow-md p-6">

          <div className="flex items-center justify-between mb-4">

            <h2 className="text-xl font-semibold text-gray-800">

              Employee Leave Tracking

            </h2>

            <span className="text-sm text-gray-500">

              Counts by leave type

            </span>

          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm text-gray-500">
                  <th className="px-4 py-2">Employee</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">FSM State</th>
                  <th className="px-4 py-2">On Leave</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">SICK</th>
                  <th className="px-4 py-2">PLANNED</th>
                  <th className="px-4 py-2">OPTIONAL</th>
                  <th className="px-4 py-2">LOP</th>
                  <th className="px-4 py-2">EARLY_LOGOUT</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr className="border-t">
                    <td className="px-4 py-6 text-sm text-gray-500" colSpan={10}>
                      No employees found.
                    </td>
                  </tr>
                )}
                {employees.map((employee) => {
                  const summary =
                    leaveSummaryByEmployee[employee.id] ||
                    leaveSummaryByEmployee[employee.email] ||
                    { total: 0, byType: {} }

                  const isOnLeave =
                    employee.current_state === "ON_LEAVE"

                  return (
                    <tr key={employee.id} className="border-t">
                      <td className="px-4 py-3">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="px-4 py-3">{employee.email}</td>
                      <td className="px-4 py-3">{employee.current_state}</td>
                      <td className="px-4 py-3">
                        {isOnLeave ? (
                          <span className="text-xs text-white bg-green-500 px-2 py-1 rounded">
                            YES
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">NO</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{summary.total}</td>
                      <td className="px-4 py-3">{summary.byType.SICK || 0}</td>
                      <td className="px-4 py-3">{summary.byType.PLANNED || 0}</td>
                      <td className="px-4 py-3">{summary.byType.OPTIONAL || 0}</td>
                      <td className="px-4 py-3">{summary.byType.LOP || 0}</td>
                      <td className="px-4 py-3">{summary.byType.EARLY_LOGOUT || 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  )
}

export default LeavePage
