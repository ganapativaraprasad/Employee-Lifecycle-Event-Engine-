import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { changeMyPassword } from "../services/userService"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
  confirm_password: z.string().min(1, "Confirm password is required"),
}).superRefine(({ new_password, confirm_password }, ctx) => {
  if (new_password !== confirm_password) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passwords do not match", path: ["confirm_password"] })
  }
})

type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>

function ChangePasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isValid } } = useForm<ChangePasswordForm>({ resolver: zodResolver(ChangePasswordSchema), mode: "onBlur", defaultValues: { current_password: "", new_password: "", confirm_password: "" } })

  const onSubmit = async (values: ChangePasswordForm) => {
    try {
      await changeMyPassword({ current_password: values.current_password, new_password: values.new_password })
      toast.success("Password updated")
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to change password"
      toast.error(msg)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Update Password</h2>
          <p className="text-xs text-gray-500 mt-1">Choose a strong and unique password.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <div>
              <label className="text-xs text-gray-500">Current Password</label>
              <Input type="password" placeholder="Current password" {...register("current_password")} className="mt-2" />
              {errors.current_password && <p className="text-sm text-red-600">{errors.current_password.message}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-500">New Password</label>
              <Input type="password" placeholder="New password" {...register("new_password")} className="mt-2" />
              {errors.new_password && <p className="text-sm text-red-600">{errors.new_password.message}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-500">Confirm New Password</label>
              <Input type="password" placeholder="Confirm new password" {...register("confirm_password")} className="mt-2" />
              {errors.confirm_password && <p className="text-sm text-red-600">{errors.confirm_password.message}</p>}
            </div>

            <Button type="submit" className="mt-5 w-full" disabled={isSubmitting || !isValid}>{isSubmitting ? "Saving..." : "Update Password"}</Button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-base font-semibold text-gray-900">Password Checklist</h2>
          <p className="text-xs text-gray-500 mt-1">Aim for a stronger password.</p>

          <div className="mt-6 space-y-4">
            <div className={`rounded-xl border p-3 ${!errors.new_password ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
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
