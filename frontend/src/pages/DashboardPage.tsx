import { useEffect, useState } from "react"

import {
  getDashboardStats
} from "../services/dashboardService"

function DashboardPage() {

  const [stats, setStats] =
    useState<any>(null)

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

      <h1 className="text-4xl font-bold text-gray-800 mb-8">

        Dashboard Overview

      </h1>

      <div className="grid grid-cols-4 gap-6">

        {/* Total Employees */}

        <div className="bg-white p-6 rounded-2xl shadow-sm">

          <h2 className="text-gray-500">

            Total Employees

          </h2>

          <p className="text-4xl font-bold mt-2">

            {stats.total_employees}

          </p>

        </div>

        {/* Active */}

        <div className="bg-white p-6 rounded-2xl shadow-sm">

          <h2 className="text-gray-500">

            Active Employees

          </h2>

          <p className="text-4xl font-bold mt-2 text-green-600">

            {stats.active_employees}

          </p>

        </div>

        {/* Onboarding */}

        <div className="bg-white p-6 rounded-2xl shadow-sm">

          <h2 className="text-gray-500">

            Onboarding

          </h2>

          <p className="text-4xl font-bold mt-2 text-blue-600">

            {stats.onboarding_employees}

          </p>

        </div>

        {/* Offboarded */}

        <div className="bg-white p-6 rounded-2xl shadow-sm">

          <h2 className="text-gray-500">

            Offboarded

          </h2>

          <p className="text-4xl font-bold mt-2 text-red-500">

            {stats.offboarded_employees}

          </p>

        </div>

      </div>

    </div>
  )
}

export default DashboardPage