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

function LeavePage() {

  const role = localStorage.getItem(
    "user_role"
  )

  const isAdmin = role === "ADMIN"
  const isHr = role === "HR_MANAGER"

  const [myLeaves, setMyLeaves] =
    useState<LeaveItem[]>([])

  const [allLeaves, setAllLeaves] = useState<LeaveItem[]>([])
  const [employees, setEmployees] = useState<any[]>([])

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
    if (isAdmin) fetchAllLeaves()
    if (isAdmin) fetchEmployees()

  }, [canReview])

  const handleApplyLeave = async () => {

    try {

      setLoading(true)
      setError("")
      setSuccess("")

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

        {canReview && (

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
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="w-full border border-gray-300 p-3 rounded-xl"
              />

              <input
                type="date"
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Leaves Overview</h2>

            {/* compute active leaves (today between start and end) */}
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-sm text-gray-500">
                        <th className="px-4 py-2">Employee</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">On Leave Today</th>
                        <th className="px-4 py-2">SICK</th>
                        <th className="px-4 py-2">PLANNED</th>
                        <th className="px-4 py-2">OPTIONAL</th>
                        <th className="px-4 py-2">LOP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => {
                        const empLeaves = allLeaves.filter(l => l.employee_email === emp.email)
                        const today = new Date()
                        const onLeave = empLeaves.some(l => {
                          try { const s = new Date(l.start_date); const e = new Date(l.end_date); return s <= today && e >= today && l.status === 'APPROVED' } catch { return false }
                        })
                        const counts: Record<string, number> = { SICK:0, PLANNED:0, OPTIONAL:0, LOP:0 }
                        empLeaves.forEach(l => { counts[l.leave_type || 'SICK'] = (counts[l.leave_type]||0) + (Math.ceil((new Date(l.end_date).getTime()-new Date(l.start_date).getTime())/(1000*60*60*24))+1) })
                        return (
                          <tr key={emp.id} className="border-t">
                            <td className="px-4 py-3">{emp.first_name} {emp.last_name}</td>
                            <td className="px-4 py-3">{emp.email}</td>
                            <td className="px-4 py-3">{onLeave ? <span className="text-sm text-white bg-green-500 px-2 py-1 rounded">YES</span> : <span className="text-sm text-gray-500">NO</span>}</td>
                            <td className="px-4 py-3">{counts.SICK||0}</td>
                            <td className="px-4 py-3">{counts.PLANNED||0}</td>
                            <td className="px-4 py-3">{counts.OPTIONAL||0}</td>
                            <td className="px-4 py-3">{counts.LOP||0}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        )}

        <div className="xl:col-span-2 space-y-6">

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

          {canReview && (

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
          )}

        </div>

      </div>

    </div>
  )
}

export default LeavePage
