import { useMemo, useState } from "react"
import { useReactTable, getCoreRowModel } from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
 

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
  total: number
  page: number
  setPage: (p: number) => void
  limit: number
  setLimit: (l: number) => void
  appliedFilters: any
  setAppliedFilters: (f: any) => void
  onEdit: (e: Employee) => void
  onDelete: (id: string) => void
  onOpenTransition: (id: string, currentState?: string) => void
  onLeaveMap: Set<string>
  role?: string | null
}

export default function EmployeeTableTanStack({ employees, loading, total, page, setPage, limit, setLimit, appliedFilters, setAppliedFilters, onEdit, onDelete, onOpenTransition, onLeaveMap, role }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const columns = useMemo<ColumnDef<Employee>[]>(() => [
    { accessorKey: "employee_code", header: "Employee Code" },
    { accessorFn: (row: Employee) => `${row.first_name} ${row.last_name}`, id: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "designation", header: "Designation" },
    { accessorKey: "created_at", header: "Joined" },
    { accessorKey: "current_state", header: "Status" },
    { accessorKey: "id", header: "Actions" },
  ], [])

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true as any,
    state: {
      sorting: appliedFilters?.sort_by ? [{ id: appliedFilters.sort_by, desc: appliedFilters.sort_order === "desc" }] : []
    }
  })

  const toggleSort = (colId: string) => {
    const current = appliedFilters.sort_by
    const currentOrder = appliedFilters.sort_order || "desc"
    let nextOrder: string = "desc"
    if (current === colId) {
      nextOrder = currentOrder === "desc" ? "asc" : "desc"
    }
    // Map UI column ids to server-side sort keys
    const serverSortKey = colId === "name" ? "first_name" : colId
    setAppliedFilters({ ...appliedFilters, sort_by: serverSortKey, sort_order: nextOrder })
    setPage(1)
  }

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <Table>
        <TableHeader>
          <tr className="bg-gray-100">
            {table.getHeaderGroups()[0].headers.map((h) => (
              <TableHead key={h.id} onClick={() => { if (h.id) toggleSort(h.id) }} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  {h.isPlaceholder ? null : h.column.columnDef.header as any}
                  {appliedFilters.sort_by === h.id && (
                    <span className="text-xs">{appliedFilters.sort_order === "desc" ? "↓" : "↑"}</span>
                  )}
                </div>
              </TableHead>
            ))}
          </tr>
          <tr>
            {table.getHeaderGroups()[0].headers.map((h) => {
              // map header id to filter key
              let key = ""
              if (h.id === "employee_code") key = "employee_code"
              else if (h.id === "name") key = "search"
              else if (h.id === "email") key = "email"
              else if (h.id === "department") key = "department"
              else if (h.id === "designation") key = "designation"

              return (
                <TableHead key={h.id} className="p-2">
                  {key ? (
                    <Input
                      placeholder="Filter"
                      value={appliedFilters?.[key] || ""}
                      onChange={(e) => { setAppliedFilters({ ...appliedFilters, [key]: e.target.value }); setPage(1) }}
                      className="w-full"
                    />
                  ) : null}
                </TableHead>
              )
            })}
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
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="px-2 py-1">⋯</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => onEdit(employee)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onOpenTransition(employee.id, employee.current_state)}>Transition</DropdownMenuItem>
                          {role === "ADMIN" && <DropdownMenuItem onClick={() => { setConfirmDeleteId(employee.id); setConfirmOpen(true); }}>Delete</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <h3 className="text-lg font-semibold">Confirm Delete</h3>
          <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this employee? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (confirmDeleteId) { onDelete(confirmDeleteId); setConfirmOpen(false); setConfirmDeleteId(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows:</label>
          <div style={{ minWidth: 160 }}>
            <Select value={String(limit)} onValueChange={(v: string) => { setLimit(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="1000">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 rounded border">Prev</button>
          <div className="px-3 py-1">Page {page} of {Math.max(1, Math.ceil(total / limit))}</div>
          <button onClick={() => setPage(Math.min(Math.max(1, Math.ceil(total / limit)), page + 1))} disabled={page >= Math.max(1, Math.ceil(total / limit))} className="px-3 py-1 rounded border">Next</button>
        </div>
      </div>
    </div>
  )
}
