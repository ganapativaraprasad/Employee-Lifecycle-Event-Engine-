// React import not required with the new JSX transform
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { listEmployees } from "@/services/employeeService"

type Filters = {
  search: string
  employee_code: string
  department: string
  designation: string
  current_state: string
  employment_status: string
  leave_status: string
  joined_from: string
  joined_to: string
  sort_by: string
  sort_order: string
}

type Props = {
  filters: Filters
  setFilters: (fn: any) => void
  applyFilters: () => void
  clearFilters: () => void
  limit: number
  setLimit: (n: number) => void
}

export default function EmployeeFilters({ filters, setFilters, applyFilters, clearFilters, limit, setLimit }: Props) {
  const [departments, setDepartments] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    const loadMeta = async () => {
      try {
        const resp = await listEmployees({ page: 1, limit: 1000 })
        const items = resp.items || []
        const deptSet = new Set<string>()
        const stateSet = new Set<string>()
        items.forEach((it: any) => {
          if (it.department) deptSet.add(it.department)
          if (it.current_state) stateSet.add(it.current_state)
        })
        if (!mounted) return
        setDepartments(Array.from(deptSet).sort())
        setStates(Array.from(stateSet).sort())
      } catch (err) {
        // ignore - fall back to defaults already present
      }
    }

    loadMeta()
    return () => { mounted = false }
  }, [])
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Input
          type="text"
          placeholder="Search name, email, or code"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <Input
          type="text"
          placeholder="Employee ID"
          value={filters.employee_code}
          onChange={(e) => setFilters({ ...filters, employee_code: e.target.value })}
          className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {departments.length > 0 ? (
          <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value === "__ANY__" ? "" : value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ANY__">Any</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type="text"
            placeholder="Department"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <Input
          type="text"
          placeholder="Designation"
          value={filters.designation}
          onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
          className="border border-gray-300 p-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <Select
          value={filters.employment_status}
          onValueChange={(value) => setFilters({ ...filters, employment_status: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Employment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="OFFBOARDED">Offboarded</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.current_state} onValueChange={(value) => setFilters({ ...filters, current_state: value === "__ANY__" ? "" : value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="FSM State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__ANY__">Any</SelectItem>
            {states.length > 0 ? states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>) : (
              ["HIRED","ONBOARDING","ACTIVE","ON_LEAVE","TRANSFERRED","SUSPENDED","OFFBOARDED"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select value={filters.leave_status} onValueChange={(value) => setFilters({ ...filters, leave_status: value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Leave Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            <SelectItem value="NOT_ON_LEAVE">Not On Leave</SelectItem>
          </SelectContent>
        </Select>

        <Input type="date" value={filters.joined_from} onChange={(e) => setFilters({ ...filters, joined_from: e.target.value })} />
        <Input type="date" value={filters.joined_to} onChange={(e) => setFilters({ ...filters, joined_to: e.target.value })} />

        <Select value={filters.sort_by} onValueChange={(value) => setFilters({ ...filters, sort_by: value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Sort by Joined</SelectItem>
            <SelectItem value="employee_code">Sort by Employee ID</SelectItem>
            <SelectItem value="first_name">Sort by First Name</SelectItem>
            <SelectItem value="last_name">Sort by Last Name</SelectItem>
            <SelectItem value="department">Sort by Department</SelectItem>
            <SelectItem value="designation">Sort by Designation</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sort_order} onValueChange={(value) => setFilters({ ...filters, sort_order: value })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700 transition text-white text-sm px-4 py-2 rounded-lg shadow-md">Apply Filters</Button>
        <Button onClick={clearFilters} className="bg-gray-100 hover:bg-gray-200 transition text-gray-700 text-sm px-4 py-2 rounded-lg">Clear</Button>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">Rows per page</span>
          <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Items Per Page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1000">All</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
