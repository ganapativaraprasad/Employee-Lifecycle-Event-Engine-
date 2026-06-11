import { useState } from "react"

import { loginUser, forgotPassword, resetPassword } from "../services/authService"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

function LoginPage() {

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [stage, setStage] = useState<'enterEmail' | 'enterCode'>("enterEmail" as 'enterEmail' | 'enterCode')
  const [showPassword, setShowPassword] = useState(false)
  const [language, setLanguage] = useState("English")

  const handleLogin = async () => {
    try {
      setLoading(true)
      
      const data = await loginUser(email, password)
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("user_role", data.user.role)
      localStorage.setItem("username", data.user.username)
      localStorage.setItem("user_email", data.user.email)
      window.location.href = "/"
    } catch (error: any) {
      const msg = "Invalid Credentials"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReset = async () => {
    try {
      setLoading(true)
      
      await forgotPassword(resetEmail)
      setStage("enterCode")
    } catch (err: any) {
      const msg = "Failed to send reset code"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      setLoading(true)
      
      if (newPassword.length < 6) {
        const msg = "Password must be at least 6 characters"
        toast.error(msg)
        setLoading(false)
        return
      }
      await resetPassword({ email: resetEmail, code: resetCode, new_password: newPassword })
      setForgotMode(false)
      setStage("enterEmail")
      setResetEmail("")
      setResetCode("")
      setNewPassword("")
      
      setLoading(false)
      const msg2 = "Password reset successful. Please log in."
      toast.success(msg2)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to reset password"
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-6 py-12">

      <div className="w-full max-w-6xl rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* LEFT - Branding */}
        <div className="hidden md:flex relative items-center justify-center p-10" style={{ background: 'linear-gradient(135deg,#f6f8ff 0%, #eef6ff 50%, #f9faff 100%)' }}>
          <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 10% 20%, rgba(124,58,237,0.08), transparent 8%), radial-gradient(circle at 90% 80%, rgba(6,182,212,0.06), transparent 10%)' }} />

          <div className="relative z-10 flex flex-col gap-6 items-start max-w-lg">
            <div>
              <h2 className="text-4xl font-display font-bold leading-tight text-slate-900">Smart HR.<br/> <span className="text-indigo-600">Stronger Teams.</span></h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {[
                'Employee Management',
                'Leave Management',
                'Attendance Tracking',
                'Performance Management',
                'Analytics & Reports',
                'Secure & Reliable'
              ].map((n) => (
                <div key={n} className="feature-badge flex items-center gap-3 p-3" style={{ minWidth: 180 }}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold">{n.split(' ').slice(0,1)[0].slice(0,1)}</div>
                  <div className="text-sm text-slate-800">{n}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute right-6 bottom-6 opacity-40">
            <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="10" y="20" width="120" height="80" rx="12" fill="#ffffff" opacity="0.6" />
              <circle cx="50" cy="60" r="18" fill="#eef6ff" />
              <rect x="75" y="40" width="80" height="10" rx="5" fill="#eef6ff" />
              <rect x="75" y="60" width="50" height="10" rx="5" fill="#f3f6ff" />
            </svg>
          </div>
        </div>

        {/* RIGHT - Login Card */}
        <div className="p-6 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md glass-card p-6 md:p-10">
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-4">
                <Select value={language} onValueChange={(v) => setLanguage(String(v))}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder={language} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Español">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-8">
              <h1 className="text-3xl font-bold text-slate-900">Welcome Back!</h1>
              <p className="mt-2 text-sm text-slate-600">Sign in to your account.</p>
            </div>

            <div className="mt-4">
              

              {!forgotMode ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email Address</label>
                    <Input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="name@company.com" className="mt-2 w-full" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-slate-700">Password</label>
                      <Button variant="link" onClick={() => { setForgotMode(true); setResetEmail(email || "") }} className="text-sm">Forgot Password?</Button>
                    </div>
                    <div className="relative mt-2">
                      <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pr-12" />
                      <Button variant="ghost" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">{showPassword ? 'Hide' : 'Show'}</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center text-sm text-slate-600">
                      <Checkbox />
                      <span className="ml-2">Remember me</span>
                    </label>
                  </div>

                  <Button onClick={handleLogin} disabled={loading} className="mt-2 w-full">{loading ? 'Signing in...' : 'Sign in'}</Button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {stage === 'enterEmail' ? (
                    <>
                      <label className="block text-sm font-medium text-slate-700">Email to reset</label>
                      <Input type="email" placeholder="name@company.com" value={resetEmail} onChange={(e: any) => setResetEmail(e.target.value)} className="mt-2 w-full" />
                      <div className="flex gap-3">
                        <button onClick={handleSendReset} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition font-semibold shadow">Send code</button>
                        <button onClick={() => { setForgotMode(false); setStage('enterEmail') }} className="mt-2 w-32 border border-gray-200 px-4 py-3 rounded-xl">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-slate-700">Enter code</label>
                      <Input type="text" placeholder="123456" value={resetCode} onChange={(e: any) => setResetCode(e.target.value)} className="mt-2 w-full" />
                      <label className="block text-sm font-medium text-slate-700">New password</label>
                      <Input type="password" placeholder="New password" value={newPassword} onChange={(e: any) => setNewPassword(e.target.value)} className="mt-2 w-full" />
                      <div className="flex gap-3">
                        <button onClick={handleReset} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition font-semibold shadow">Reset password</button>
                        <button onClick={() => { setForgotMode(false); setStage('enterEmail') }} className="mt-2 w-32 border border-gray-200 px-4 py-3 rounded-xl">Cancel</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 border-t pt-4 text-center">
              <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                <span>Secure</span>
                <span>•</span>
                <span>Reliable</span>
                <span>•</span>
                <span>Trusted</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">Your data is protected with enterprise-grade security</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage