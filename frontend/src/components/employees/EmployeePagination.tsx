// React import not required with the new JSX transform
import { Button } from "@/components/ui/button"

type Props = {
  page: number
  total: number
  limit: number
  setPage: (n: number) => void
}

export default function EmployeePagination({ page, total, limit, setPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
      <div className="text-sm text-gray-500">Showing {total === 0 ? 0 : (page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}</div>

      <div className="flex items-center gap-2">
        <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:text-gray-400 disabled:border-gray-200">Previous</Button>
        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
        <Button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:text-gray-400 disabled:border-gray-200">Next</Button>
      </div>
    </div>
  )
}
