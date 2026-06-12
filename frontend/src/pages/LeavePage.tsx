import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import {
  applyLeave,
  approveLeave,
  getLeaveStats,
  listLeaves,
  listMyLeaves,
  rejectLeave,
  getPendingLeaves
} from "../services/leaveService"
import { listEmployees } from "../services/employeeService"
import { listUsers } from "../services/userService"
import { toast } from "sonner"
import LeaveDecisionForm from "@/components/leaves/LeaveDecisionForm"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Controller } from "react-hook-form"

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
  department?: string
  designation?: string
}

type UserItem = {
  id: string
  email: string
  role: string
}

function LeavePage() {

  const role = localStorage.getItem(
    "user_role"
  )

  const userEmail =
    (localStorage.getItem("user_email") || "").toLowerCase()

  const isAdmin = role === "ADMIN"
  const isHr = role === "HR_MANAGER"
  

  const [myLeaves, setMyLeaves] =
    useState<LeaveItem[]>([])

  const [allLeaves, setAllLeaves] = useState<LeaveItem[]>([])

  const [employees, setEmployees] = useState<Employee[]>([])

  const [users, setUsers] = useState<UserItem[]>([])

  const [teamLeaves, setTeamLeaves] =
    useState<LeaveItem[]>([])

  const [serverPendingLeaves, setServerPendingLeaves] = useState<LeaveItem[]>([])

  const [stats, setStats] =
    useState({ pending: 0, approved: 0, rejected: 0 })

  const [loading, setLoading] =
    useState(false)

  const LeaveSchema = z.object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z.string().min(1, "Reason is required"),
    leave_type: z.enum(["SICK", "PLANNED", "OPTIONAL", "LOP", "EARLY_LOGOUT"]),
  })

  type LeaveFormValues = z.infer<typeof LeaveSchema>

  const { register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting } } = useForm<LeaveFormValues>({
    resolver: zodResolver(LeaveSchema),
    mode: "onBlur",
    defaultValues: {
      start_date: "",
      end_date: "",
      reason: "",
      leave_type: "SICK",
    },
  })

  

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

    allLeaves
      .filter((leave) => (leave.status || "").toUpperCase() === "APPROVED")
      .forEach((leave) => {
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

  const currentEmployeeId = useMemo(() => {
    if (!userEmail) {
      return ""
    }

    const match = employees.find(
      (employee) => employee.email.toLowerCase() === userEmail
    )

    return match?.id || ""
  }, [employees, userEmail])

  const userRoleByEmail = useMemo(() => {
    const map: Record<string, string> = {}

    // Prefer explicit user roles when available (admin only)
    users.forEach((user) => {
      if (user.email) {
        map[user.email.toLowerCase()] = user.role
      }
    })

    // Fallback: infer HR managers from `employees` list by department/designation
    employees.forEach((emp) => {
      try {
        const email = (emp.email || "").toLowerCase()
        if (!email) return

        const dept = (emp.department || "").toLowerCase()
        const desig = (emp.designation || "").toLowerCase()

        if (dept.includes("human") && dept.includes("resourc") || desig.includes("hr") || desig.includes("human resources")) {
          map[email] = "HR_MANAGER"
        }
      } catch {
        /* ignore */
      }
    })

    return map
  }, [users, employees])

  const visibleTeamLeaves = useMemo(() => {
    // Legacy complex role filters removed. Keep this hook for compatibility
    // but return the raw team leaves by default. Use explicit hr/admin
    // pending lists (based on allLeaves) for approval rendering.
    if (!canReview) return [] as LeaveItem[]
    return teamLeaves
  }, [teamLeaves, isAdmin, canReview, userRoleByEmail, employees])

  // HR pending approvals: all leaves with status PENDING
  const hrPendingLeaves = useMemo(() => {
    if (!isHr) return [] as LeaveItem[]
    if (serverPendingLeaves && serverPendingLeaves.length > 0) return serverPendingLeaves
    // Use union of allLeaves and teamLeaves to avoid missing items due to backend differences
    const combined = [...(allLeaves || []), ...(teamLeaves || [])]
    const map: Record<string, LeaveItem> = {}
    combined.forEach((l) => {
      if (!l || !l.id) return
      map[l.id] = l
    })

    return Object.values(map).filter((leave) => {
      if ((leave.status || "").toUpperCase() !== "PENDING") return false

      const email = (leave.employee_email || leave.requested_by || "").toLowerCase()

      // Exclude own requests (by email when available)
      if (email === userEmail) return false

      // If the requester is explicitly mapped to HR or ADMIN via users map, exclude
      const roleFor = (userRoleByEmail[email] || "").toUpperCase()
      if (roleFor === "HR_MANAGER" || roleFor === "ADMIN") return false

      // Try to find the requester in employees. If found and is HR, exclude.
      const requester = employees.find((e) => (e.id === leave.employee_id) || ((e.email || "").toLowerCase() === email))
      if (requester) {
        const dept = (requester.department || "").toLowerCase()
        const desig = (requester.designation || "").toLowerCase()
        if (dept.includes("human") || desig.includes("hr") || desig.includes("human resources")) {
          return false
        }
        return true
      }

      // Fallback: requester not found in employees. Assume it's an employee unless role map marks it HR/ADMIN.
      return true
    })
  }, [allLeaves, teamLeaves, isHr, employees, userEmail, serverPendingLeaves])

  // Admin pending leaves: all leaves with status PENDING
  const adminPendingLeaves = useMemo(() => {
    if (!isAdmin) return [] as LeaveItem[]
    // Prefer server-provided pending list when available
    if (serverPendingLeaves && serverPendingLeaves.length > 0) return serverPendingLeaves
    const combined = [...(allLeaves || []), ...(teamLeaves || [])]
    const map: Record<string, LeaveItem> = {}
    combined.forEach((l) => {
      if (!l || !l.id) return
      map[l.id] = l
    })

    return Object.values(map).filter((leave) => (leave.status || "").toUpperCase() === "PENDING")
  }, [allLeaves, teamLeaves, isAdmin, serverPendingLeaves])

  const upcomingLeaves = useMemo(() => {
    if (!isAdmin) {
      return [] as LeaveItem[]
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return allLeaves
      .filter((leave) => {
        if ((leave.status || "").toUpperCase() !== "APPROVED") {
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
        if ((leave.status || "").toUpperCase() !== "PENDING") {
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
  }, [allLeaves, isAdmin, userRoleByEmail])

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
    try {

      const data = await listLeaves({
        page: 1,
        limit: 1000
      })
      setTeamLeaves(data.items || [])

    } catch (error) {

      console.error("TEAM ERROR")
      console.error(error)

    }
  }

  const fetchAllLeaves = async () => {
    try {
      const data: LeaveListResponse = await listLeaves({ page: 1, limit: 1000 })
      setAllLeaves(data.items || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPendingLeaves = async () => {
    try {
      const data: LeaveListResponse = await getPendingLeaves({ page: 1, limit: 1000 })
      setServerPendingLeaves(data.items || [])
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

  const fetchUsers = async () => {
    try {
      const data = await listUsers()
      setUsers(data.items || data || [])
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

    if (!(isAdmin || isHr)) {
      return
    }

    fetchAllLeaves()
    fetchEmployees()
    fetchPendingLeaves()

    // Fetch user list only for admins (endpoint is admin-only). HR will
    // instead be able to infer HR-manager emails from the `employees` list.
    if (isAdmin) {
      fetchUsers()
    }

  }, [isAdmin, isHr])

  const handleApplyLeave = async (data: any) => {
    try {
      setLoading(true)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)

      if (startDate < today || endDate < today) {
        const msg = "Leave dates must be today or later."
        toast.error(msg)
        setLoading(false)
        return
      }

      if (endDate < startDate) {
        const msg = "End date must be on or after the start date."
        toast.error(msg)
        setLoading(false)
        return
      }

      if (data.leave_type === "PLANNED") {
        const minPlannedStart = new Date(today)
        minPlannedStart.setDate(minPlannedStart.getDate() + 7)

        if (startDate < minPlannedStart) {
          const msg = "Planned leave must be applied at least 7 days in advance."
          toast.error(msg)
          setLoading(false)
          return
        }
      }

      const hasOverlap = myLeaves.some((leave) => {
        if (leave.status === "REJECTED") {
          return false
        }

        const existingStart = new Date(leave.start_date)
        const existingEnd = new Date(leave.end_date)
        existingStart.setHours(0, 0, 0, 0)
        existingEnd.setHours(0, 0, 0, 0)

        return startDate <= existingEnd && endDate >= existingStart
      })

      if (hasOverlap) {
        const msg = "You already have a leave request overlapping these dates."
        toast.error(msg)
        setLoading(false)
        return
      }

      const employeeIdToSend = currentEmployeeId || undefined

      await applyLeave({
        ...data,
        ...(employeeIdToSend ? { employee_id: employeeIdToSend } : {})
      })

      reset()

      await fetchMyLeaves()
      await fetchTeamLeaves()
      await fetchStats()

      const successMsg = "Leave request submitted"
      toast.success(successMsg)

    } catch (error: any) {
      console.log(error)
      const msg = error?.response?.data?.detail || "Failed to apply leave"
      toast.error(msg)
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

      myLeaves
        .filter((leave) => (leave.status || "").toUpperCase() === "APPROVED")
        .forEach((l) => {
        try {
          const s = new Date(l.start_date)
          const e = new Date(l.end_date)
          const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
          const key = (l as any).leave_type || 'SICK'
          map[key] = (map[key] || 0) + diff
        } catch {
          /* ignore */
        }
      })

      return map
    }, [myLeaves])

  const handleDecision = async (
    leaveId: string,
    decision: "approve" | "reject",
    note?: string
  ) => {

    try {

      setLoading(true)

      const noteValue = (note || "").trim()

      if (decision === "reject" && !noteValue) {
        const msg = "Rejection reason is required"
        toast.error(msg)
        setLoading(false)
        return
      }


      if (decision === "approve") {
        await approveLeave(leaveId, { decision_note: noteValue })
      } else {
        await rejectLeave(leaveId, { decision_note: noteValue })
      }

      const successMsg2 = decision === "approve" ? "Leave request approved" : "Leave request rejected"
      toast.success(successMsg2)

    // Refresh data to reflect the updated approval state
    await fetchAllLeaves()
    await fetchTeamLeaves()
    await fetchMyLeaves()
    await fetchStats()
    await fetchPendingLeaves()

    } catch (error: any) {

      console.log(error)
      const msg2 = error?.response?.data?.detail || "Failed to update request"
      toast.error(msg2)

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
          <div className="bg-linear-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-wider">Total Leaves Used</div>
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

      

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {!isAdmin ? (
          <div className="bg-white rounded-2xl shadow-md p-6">

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply Leave</h2>

            <form onSubmit={handleSubmit(handleApplyLeave)} className="space-y-4">
              <div>
                <Input
                  type="date"
                  {...register("start_date")}
                  min={
                    (watch("leave_type") === "PLANNED")
                      ? new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                  className="w-full"
                />
                {errors.start_date && <p className="text-sm text-destructive mt-1">{(errors.start_date as any).message}</p>}
              </div>

              <div>
                <Input
                  type="date"
                  {...register("end_date")}
                  min={watch("start_date") || new Date().toISOString().split("T")[0]}
                  className="w-full"
                />
                {errors.end_date && <p className="text-sm text-destructive mt-1">{(errors.end_date as any).message}</p>}
              </div>

              <div>
                <label className="text-sm text-gray-600">Leave Type</label>
                <Controller
                  control={control}
                  name="leave_type"
                  render={({ field }) => (
                    <Select onValueChange={(v) => field.onChange(v)} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SICK">Sick Leave</SelectItem>
                        <SelectItem value="PLANNED">Planned Leave</SelectItem>
                        <SelectItem value="OPTIONAL">Optional Holiday</SelectItem>
                        <SelectItem value="LOP">Leave Without Pay (LOP)</SelectItem>
                        <SelectItem value="EARLY_LOGOUT">Early Logout</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Textarea
                  placeholder="Reason"
                  {...register("reason")}
                  className="w-full"
                />
                {errors.reason && <p className="text-sm text-destructive mt-1">{(errors.reason as any).message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading || isSubmitting}
                className="mt-6 w-full"
              >
                {loading || isSubmitting ? "Submitting..." : "Submit Leave"}
              </Button>
            </form>

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

                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">

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

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(leave.status || "").toUpperCase() === "APPROVED" ? "bg-green-100 text-green-700" : (leave.status || "").toUpperCase() === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>

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

                  Pending Approvals

                </h2>

                <span className="text-sm text-gray-500">

                  Upcoming decisions

                </span>

              </div>

              {adminPendingLeaves.length === 0 ? (
                <div className="text-sm text-gray-500">No pending leaves from today onward.</div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {adminPendingLeaves.map((leave) => (
                    <div key={leave.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-800">
                            {leave.employee_name} ({leave.employee_email || leave.requested_by})
                          </p>
                          <p className="text-sm text-gray-500">
                            {leave.leave_type || ""} — {leave.start_date} to {leave.end_date}
                          </p>
                          <p className="text-sm text-gray-500">{leave.reason}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">{leave.status}</span>
                      </div>

                      <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
                        <LeaveDecisionForm leaveId={leave.id} onDecision={(id, decision, note) => handleDecision(id, decision, note)} disabled={loading} />
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
                  <h2 className="text-xl font-semibold text-gray-800">Pending Approvals</h2>
                  <span className="text-sm text-gray-500">Latest 10 requests</span>
                </div>

                {hrPendingLeaves.length === 0 ? (
                  <div className="text-sm text-gray-500">No pending requests.</div>
                ) : (
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {hrPendingLeaves.map((leave) => {
                      const requesterEmail = (leave.employee_email || leave.requested_by || "").toLowerCase()
                      const isOwn = requesterEmail === userEmail
                      const requesterRole = (userRoleByEmail[requesterEmail] || "").toUpperCase()
                      const canHrDecide = isHr && !isOwn && requesterRole !== "ADMIN"

                      return (
                        <div key={leave.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-gray-800">{leave.employee_name} ({leave.employee_email || leave.requested_by})</p>
                              <p className="text-sm text-gray-500">{leave.leave_type || ""} — {leave.start_date} to {leave.end_date}</p>
                              <p className="text-sm text-gray-500">{leave.reason}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">{leave.status}</span>
                          </div>

                          {canHrDecide && (
                            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
                              <LeaveDecisionForm leaveId={leave.id} onDecision={(id, decision, note) => handleDecision(id, decision, note)} disabled={loading} />
                            </div>
                          )}

                        </div>
                      )
                    })}
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
