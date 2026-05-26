type NoticeVariant = "success" | "error" | "info"

type Props = {
  message: string
  variant?: NoticeVariant
}

const styles: Record<NoticeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-slate-50 text-slate-600 border-slate-200"
}

function InlineNotice({
  message,
  variant = "info"
}: Props) {

  if (!message) {
    return null
  }

  return (

    <div className={`animate-fade-in border rounded-xl p-4 mb-6 text-sm font-medium ${styles[variant]}`}>

      {message}

    </div>
  )
}

export default InlineNotice
