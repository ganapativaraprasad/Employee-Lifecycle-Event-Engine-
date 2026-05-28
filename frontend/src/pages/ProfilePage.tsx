import { useEffect, useState } from "react"

import {
  getMyProfile,
  updateMyProfile
} from "../services/userService"
import InlineNotice from "../components/InlineNotice"

type Profile = {
  id: string
  username: string
  email: string
  role: string
  is_active: boolean
}

function ProfilePage() {

  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [formData, setFormData] =
    useState({ username: "", email: "" })

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")

  const displayName = profile?.username || "User"
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const loadProfile = async () => {

    try {

      setLoading(true)
      setError("")

      const data = await getMyProfile()

      setProfile(data)

      setFormData({
        username: data.username,
        email: data.email
      })

    } catch (error) {

      console.log(error)

      setError("Failed to load profile")

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {

    loadProfile()

  }, [])

  const handleUpdate = async () => {

    try {

      setLoading(true)
      setError("")
      setSuccess("")

      const data = await updateMyProfile({
        username: formData.username,
        email: formData.email
      })

      setProfile(data)

      localStorage.setItem(
        "username",
        data.username
      )

      localStorage.setItem(
        "user_email",
        data.email
      )

      setSuccess("Profile updated")

    } catch (error: any) {

      console.log(error)

      setError(
        error?.response?.data?.detail ||
        "Failed to update profile"
      )

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className="animate-fade-in space-y-6">

      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 shadow-lg">
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-emerald-400/20" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-sky-400/20" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Account</p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-3">My Profile</h1>
            <p className="text-slate-300 mt-2">Manage your identity, status, and contact details.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold">{displayName}</p>
              <p className="text-sm text-slate-300">{profile?.email || "-"}</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {profile?.role || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <InlineNotice message={error} variant="error" />
      <InlineNotice message={success} variant="success" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">Profile Details</h2>
          <p className="text-sm text-gray-500 mt-1">Keep your info current for notifications.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <label className="text-sm text-gray-500">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value
                  })
                }
                className="w-full border border-gray-300 p-3 rounded-xl mt-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value
                  })
                }
                className="w-full border border-gray-300 p-3 rounded-xl mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Role</p>
              <p className="text-gray-900 font-semibold mt-2">{profile?.role || "-"}</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Status</p>
              <p className="text-gray-900 font-semibold mt-2">
                {profile?.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="mt-6 w-full bg-slate-900 hover:bg-slate-800 transition text-white text-sm px-4 py-3 rounded-xl shadow-md disabled:bg-slate-400"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900">Account Health</h2>
          <p className="text-sm text-gray-500 mt-1">Quick checks for your profile.</p>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-700">Profile Verified</p>
              <p className="text-xs text-emerald-600 mt-1">Your account is active and ready.</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Security Tips</p>
              <ul className="text-xs text-slate-600 mt-2 space-y-2">
                <li>Keep your email current for alerts.</li>
                <li>Use a strong password and update regularly.</li>
                <li>Reach out to HR if access changes.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default ProfilePage
