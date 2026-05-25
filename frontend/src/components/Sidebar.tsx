import {
  LayoutDashboard,
  Users,
  LogOut
} from "lucide-react"

function Sidebar() {

  return (

    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col">

      <div className="p-6 text-2xl font-bold border-b border-slate-700">

        HRMS 🚀

      </div>

      <nav className="flex-1 p-4 space-y-2">

        <button
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition"
        >
          <LayoutDashboard size={20} />

          Dashboard
        </button>

        <button
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition"
        >
          <Users size={20} />

          Employees
        </button>

      </nav>

      <div className="p-4 border-t border-slate-700">

        <button
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition"
        >
          <LogOut size={20} />

          Logout
        </button>

      </div>

    </div>
  )
}

export default Sidebar