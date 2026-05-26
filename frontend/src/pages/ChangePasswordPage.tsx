import { useState } from "react"

import { changeMyPassword } from "../services/userService"
import InlineNotice from "../components/InlineNotice"

function ChangePasswordPage() {

  const [currentPassword, setCurrentPassword] =
    useState("")

  const [newPassword, setNewPassword] =
    useState("")

  const [confirmPassword, setConfirmPassword] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const handleChange = async () => {

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {

      setLoading(true)
      setError("")
      setSuccess("")

      await changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setSuccess("Password updated")

    } catch (error: any) {

      console.log(error)

      setError(
        error?.response?.data?.detail ||
        "Failed to change password"
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

            Change Password

          </h1>

          <p className="text-gray-500 mt-1">

            Update your account password securely.

          </p>

        </div>

      </div>

      <InlineNotice message={error} variant="error" />

      <InlineNotice message={success} variant="success" />

      <div className="bg-white rounded-2xl shadow-md p-6 max-w-xl">

        <div className="space-y-4">

          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-xl"
          />

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-xl"
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-xl"
          />

        </div>

        <button
          onClick={handleChange}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition text-white text-sm px-4 py-2 rounded-lg shadow-md disabled:bg-blue-300"
        >

          {loading ? "Saving..." : "Update Password"}

        </button>

      </div>

    </div>
  )
}

export default ChangePasswordPage
