// React import not required with the new JSX transform
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FaEdit, FaTrash } from "react-icons/fa"

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

type Props = {
  employees: Employee[]
  loading: boolean
  onEdit: (e: Employee) => void
  onDelete: (id: string) => void
  onOpenTransition: (id: string, currentState?: string) => void
  onLeaveMap: Set<string>
  role?: string | null
}

export default function EmployeeTable({ employees, loading, onEdit, onDelete, onOpenTransition, onLeaveMap, role }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <Table>
        <TableHeader>
          <tr className="bg-gray-100">
            <TableHead>Employee Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>

        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={8} className="p-6 text-center text-gray-500">Loading employees...</TableCell>
            </TableRow>
          )}

          {!loading && employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="p-6 text-center text-gray-500">No employees match your filters.</TableCell>
            </TableRow>
          )}

          {!loading && employees.map((employee) => {
            const isOnLeave = onLeaveMap.has(employee.id) || onLeaveMap.has(employee.email.toLowerCase())
            const displayState = isOnLeave ? "ON_LEAVE" : employee.current_state

            return (
              <TableRow key={employee.id}>
                <TableCell className="p-4 font-medium">{employee.employee_code}</TableCell>
                <TableCell className="p-4">{employee.first_name} {employee.last_name}</TableCell>
                <TableCell className="p-4 text-gray-600">{employee.email}</TableCell>
                <TableCell className="p-4">{employee.department}</TableCell>
                <TableCell className="p-4">{employee.designation}</TableCell>
                <TableCell className="p-4 text-gray-600">{new Date(employee.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="p-4">
                  <div className="flex items-center gap-3">
                    <Badge className={`px-4 py-1 rounded-full text-sm font-semibold ${displayState === "ACTIVE" ? "bg-green-100 text-green-700" : displayState === "OFFBOARDED" ? "bg-red-100 text-red-700" : displayState === "SUSPENDED" ? "bg-yellow-100 text-yellow-700" : displayState === "ON_LEAVE" ? "bg-purple-100 text-purple-700" : displayState === "TRANSFERRED" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>{displayState}</Badge>
                    {role !== "EMPLOYEE" ? (
                      <Button onClick={() => onOpenTransition(employee.id, employee.current_state)} className="text-sm">Transition</Button>
                    ) : (
                      <span className="text-gray-400 text-sm">No Access</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-4">
                  {(role === "ADMIN" || role === "HR_MANAGER") ? (
                    <div className="flex gap-3">
                      <Button onClick={() => onEdit(employee)} className="bg-yellow-100 text-yellow-700 p-2 rounded-lg hover:bg-yellow-200"><FaEdit /></Button>
                      {role === "ADMIN" && <Button onClick={() => onDelete(employee.id)} className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200"><FaTrash /></Button>}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No Access</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
