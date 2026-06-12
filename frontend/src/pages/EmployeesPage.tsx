import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

import EmployeeFilters from "@/components/employees/EmployeeFilters"
import EmployeeTable from "@/components/employees/EmployeeTableTanStack"
import EmployeeTransitionDialog from "@/components/employees/EmployeeTransitionDialog"

import { getEmployees, createEmployee, deleteEmployee, updateEmployee } from "@/services/employeeService"
import { listLeaves } from "@/services/leaveService"

type Employee = {
  id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  department: string
  designation: string
  current_state: string
  created_at: string
}

type EmployeeResponse = {
  items: Employee[]
  total: number
  page: number
  limit: number
}

type LeaveItem = {
  employee_id: string
  employee_email: string
  start_date: string
  end_date: string
  status: string
}

const defaultFilters = {
  search: "",
  employee_code: "",
  department: "",
  designation: "",
  current_state: "",
  employment_status: "",
  leave_status: "",
  joined_from: "",
  joined_to: "",
  sort_by: "created_at",
  sort_order: "desc",
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [allLeaves, setAllLeaves] = useState<LeaveItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(1000)
  const [filters, setFilters] = useState<any>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<any>(defaultFilters)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")

  const EmployeeSchema = z.object({
    employee_code: z.string().min(1, "Employee code is required"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    department: z.string().optional(),
    designation: z.string().optional(),
  })

  type EmployeeFormValues = z.infer<typeof EmployeeSchema>

  const { register, handleSubmit, reset, formState: { errors, isValid, isSubmitting } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(EmployeeSchema),
    mode: "onBlur",
    defaultValues: {
      employee_code: "",
      first_name: "",
      last_name: "",
      email: "",
      department: "",
      designation: "",
    },
  })

  const [transitionOpen, setTransitionOpen] = useState(false)
  const [transitionEmployeeState, setTransitionEmployeeState] = useState<string | undefined>(undefined)
  const prevStateRef = { current: "" } as any

  const role = localStorage.getItem("user_role")

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const data: EmployeeResponse = await getEmployees({ ...appliedFilters, page, limit })
      setEmployees(data.items)
      setTotal(data.total)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load employees")
    } finally {
      setLoading(false)
    }
  }

  const fetchAllLeaves = async () => {
    if (role === "EMPLOYEE") return
    try {
      const data = await listLeaves({ page: 1, limit: 2000 })
      setAllLeaves(data.items || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    // fetch leaves once when page/role/limit change or on mount
    const load = async () => {
      await fetchAllLeaves()
    }

    load()
  }, [])

  useEffect(() => {
    // fetch immediately when page or limit change
    const load = async () => {
      await fetchEmployees()
    }

    load()
  }, [page, limit])

  useEffect(() => {
    // debounce applied filter changes to avoid spamming API on each keystroke
    const t = setTimeout(() => {
      setPage(1)
      fetchEmployees()
    }, 400)

    return () => clearTimeout(t)
  }, [appliedFilters])

  const onLeaveMap = useMemo(() => {
    const map = new Set<string>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    allLeaves.forEach((leave) => {
      if (leave.status !== "APPROVED") return
      const start = new Date(leave.start_date)
      const end = new Date(leave.end_date)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      if (start <= today && end >= today) {
        if (leave.employee_id) map.add(leave.employee_id)
        if (leave.employee_email) map.add(leave.employee_email.toLowerCase())
      }
    })
    return map
  }, [allLeaves])

  const resetForm = () => {
    reset()
    setIsEdit(false)
    setSelectedEmployeeId("")
  }

  const handleCreateEmployee = async (data: any) => {
    try {
      await createEmployee(data)
      await fetchEmployees()
      setShowModal(false)
      resetForm()
      toast.success("Employee created successfully")
    } catch (e) {
      console.error(e)
      toast.error("Failed to create employee")
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      await deleteEmployee(employeeId)
      await fetchEmployees()
      toast.success("Employee deleted successfully")
    } catch (e) {
      console.error(e)
      toast.error("Failed to delete employee")
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setIsEdit(true)
    setSelectedEmployeeId(employee.id)
    reset({
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      department: employee.department || "",
      designation: employee.designation || "",
    })
    setShowModal(true)
  }

  const handleUpdateEmployee = async (data: any) => {
    try {
      await updateEmployee(selectedEmployeeId, data)
      await fetchEmployees()
      setShowModal(false)
      resetForm()
      toast.success("Employee updated successfully")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update employee")
    }
  }

  const applyFilters = () => {
    setPage(1)
    setAppliedFilters(filters)
  }

  const clearFilters = () => {
    setPage(1)
    setFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-500 mt-1">Manage your employees</p>
        </div>

        {role !== "EMPLOYEE" && (
          <Button onClick={() => { resetForm(); setShowModal(true) }} className="bg-blue-600 hover:bg-blue-700 transition text-white text-sm px-4 py-2 rounded-lg shadow-md">+ Add Employee</Button>
        )}
      </div>

      <EmployeeFilters filters={filters} setFilters={setFilters} applyFilters={applyFilters} clearFilters={clearFilters} limit={limit} setLimit={setLimit} />

      <EmployeeTable employees={employees} loading={loading} total={total} page={page} setPage={setPage} limit={limit} setLimit={setLimit} appliedFilters={appliedFilters} setAppliedFilters={setAppliedFilters} onEdit={handleEditEmployee} onDelete={handleDeleteEmployee} onOpenTransition={(id, state) => { setSelectedEmployeeId(id || ""); setTransitionEmployeeState(state); setTransitionOpen(true); }} onLeaveMap={onLeaveMap} role={role} />

      <EmployeeTransitionDialog
        open={transitionOpen}
        onOpenChange={setTransitionOpen}
        employeeId={selectedEmployeeId || null}
        currentState={transitionEmployeeState}
        // eslint-disable-next-line react-hooks/immutability
        onOptimistic={(newState: string) => {
          // store previous state for potential revert
          const prev = employees.find((e) => e.id === selectedEmployeeId)?.current_state
          prevStateRef.current = prev
          setEmployees((prevList) => prevList.map((e) => e.id === selectedEmployeeId ? { ...e, current_state: newState } : e))
        }}
        onError={() => {
          // revert to previous state
          const prev = prevStateRef.current
          setEmployees((prevList) => prevList.map((e) => e.id === selectedEmployeeId ? { ...e, current_state: prev || e.current_state } : e))
          // refresh from server to be safe
          fetchEmployees()
        }}
        onSuccess={() => fetchEmployees()}
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <h2 className="text-3xl font-bold mb-6">{isEdit ? "Edit Employee" : "Add Employee"}</h2>
          <form onSubmit={handleSubmit(isEdit ? handleUpdateEmployee : handleCreateEmployee)} className="space-y-4">
            <div>
              <Input type="text" placeholder="Employee Code" {...register("employee_code")}
              />
              {errors.employee_code && <p className="text-sm text-red-600 mt-1">{(errors.employee_code as any).message}</p>}
            </div>

            <div>
              <Input type="text" placeholder="First Name" {...register("first_name")} />
              {errors.first_name && <p className="text-sm text-red-600 mt-1">{(errors.first_name as any).message}</p>}
            </div>

            <div>
              <Input type="text" placeholder="Last Name" {...register("last_name")} />
              {errors.last_name && <p className="text-sm text-red-600 mt-1">{(errors.last_name as any).message}</p>}
            </div>

            <div>
              <Input type="email" placeholder="Email" {...register("email")} />
              {errors.email && <p className="text-sm text-red-600 mt-1">{(errors.email as any).message}</p>}
            </div>

            <div>
              <Input type="text" placeholder="Department" {...register("department")} />
              {errors.department && <p className="text-sm text-red-600 mt-1">{(errors.department as any).message}</p>}
            </div>

            <div>
              <Input type="text" placeholder="Designation" {...register("designation")} />
              {errors.designation && <p className="text-sm text-red-600 mt-1">{(errors.designation as any).message}</p>}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => { setShowModal(false); resetForm() }}>Cancel</Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>{isEdit ? "Update Employee" : "Create Employee"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
