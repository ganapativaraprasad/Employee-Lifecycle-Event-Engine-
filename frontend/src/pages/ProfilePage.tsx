import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { getMyProfile, updateMyProfile } from "../services/userService"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

  const [loading, setLoading] = useState(false)

  const ProfileSchema = z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address"),
  })

  type ProfileForm = z.infer<typeof ProfileSchema>

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting, isValid } } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { username: "", email: "" },
    mode: "onBlur",
  })

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

      const data = await getMyProfile()

      setProfile(data)

      setValue("username", data.username)
      setValue("email", data.email)

    } catch (error) {

      console.log(error)
      const msg = "Failed to load profile"
      toast.error(msg)

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      await loadProfile()
    }

    load()
  }, [])

  const handleUpdate = async (values: ProfileForm) => {
    try {
      setLoading(true)

      const data = await updateMyProfile({ username: values.username, email: values.email })
      setProfile(data)
      localStorage.setItem("username", data.username)
      localStorage.setItem("user_email", data.email)
      toast.success("Profile updated")
    } catch (error: any) {
      console.log(error)
      const msg = error?.response?.data?.detail || "Failed to update profile"
      toast.error(msg)
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

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900">Profile Details</h2>
          <p className="text-sm text-gray-500 mt-1">Keep your info current for notifications.</p>

          <form onSubmit={handleSubmit(handleUpdate)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-sm text-gray-500">Username</label>
                <Input {...register("username")} className="mt-2" />
                {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <Input {...register("email")} type="email" className="mt-2" />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
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

            <Button type="submit" className="mt-6 w-full" disabled={loading || isSubmitting || !isValid}>{loading || isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </form>
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
