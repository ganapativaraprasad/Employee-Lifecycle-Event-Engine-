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

    <div className="animate-fade-in">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>

          <h1 className="text-3xl font-bold text-gray-800">

            My Profile

          </h1>

          <p className="text-gray-500 mt-1">

            Update your account details.

          </p>

        </div>

      </div>

      <InlineNotice message={error} variant="error" />

      <InlineNotice message={success} variant="success" />

      <div className="bg-white rounded-2xl shadow-md p-6 max-w-xl">

        <div className="space-y-4">

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
            className="w-full border border-gray-300 p-3 rounded-xl"
          />

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
            className="w-full border border-gray-300 p-3 rounded-xl"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="border border-gray-100 rounded-xl p-4">

              <p className="text-sm text-gray-500">Role</p>

              <p className="text-gray-800 font-semibold mt-1">

                {profile?.role || "-"}

              </p>

            </div>

            <div className="border border-gray-100 rounded-xl p-4">

              <p className="text-sm text-gray-500">Status</p>

              <p className="text-gray-800 font-semibold mt-1">

                {profile?.is_active ? "Active" : "Inactive"}

              </p>

            </div>

          </div>

        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 transition text-white text-sm px-4 py-2 rounded-lg shadow-md disabled:bg-blue-300"
        >

          {loading ? "Saving..." : "Save Changes"}

        </button>

      </div>

    </div>
  )
}

export default ProfilePage
