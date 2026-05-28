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

  const passwordMeetsRule = (value: string) => {
    return value.length >= 8
  }

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

    <div className="animate-fade-in space-y-6">

      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 shadow-lg">
        <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-white/20" />
        <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Security</p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-3">Change Password</h1>
          <p className="text-slate-300 mt-2">Keep your account secure with a strong password.</p>
        </div>
      </div>

      <InlineNotice message={error} variant="error" />

      <InlineNotice message={success} variant="success" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Update Password</h2>
          <p className="text-xs text-gray-500 mt-1">Choose a strong and unique password.</p>

          <div className="space-y-4 mt-6">
            <div>
              <label className="text-xs text-gray-500">Current Password</label>
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg mt-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">New Password</label>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg mt-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 p-2.5 rounded-lg mt-2 text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleChange}
            disabled={loading}
            className="mt-5 w-full bg-slate-900 hover:bg-slate-800 transition text-white text-sm px-4 py-2.5 rounded-lg shadow-md disabled:bg-slate-400"
          >
            {loading ? "Saving..." : "Update Password"}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-base font-semibold text-gray-900">Password Checklist</h2>
          <p className="text-xs text-gray-500 mt-1">Aim for a stronger password.</p>

          <div className="mt-6 space-y-4">
            <div className={`rounded-xl border p-3 ${
              passwordMeetsRule(newPassword)
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50"
            }`}>
              <p className="text-sm font-semibold text-gray-800">Minimum 8 characters</p>
              <p className="text-xs text-gray-500 mt-1">Longer is safer and easier to remember.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-700">Good practices</p>
              <ul className="text-xs text-slate-600 mt-2 space-y-2">
                <li>Mix letters, numbers, and symbols.</li>
                <li>Do not reuse old passwords.</li>
                <li>Update every few months.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default ChangePasswordPage
