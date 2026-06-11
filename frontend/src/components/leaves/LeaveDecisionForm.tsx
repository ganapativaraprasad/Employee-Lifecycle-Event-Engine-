import { useForm } from "react-hook-form"
import { useState } from "react"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  leaveId: string
  onDecision: (leaveId: string, decision: "approve" | "reject", note?: string) => void
  disabled?: boolean
}

export default function LeaveDecisionForm({ leaveId, onDecision, disabled }: Props) {
  const { register, getValues } = useForm<{ decision_note: string }>({ defaultValues: { decision_note: "" } })
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")

  const submitApprove = () => {
    const note = getValues().decision_note || undefined
    onDecision(leaveId, "approve", note)
  }

  const openRejectDialog = () => {
    setReason( (getValues().decision_note) || "" )
    setOpen(true)
  }

  const confirmReject = () => {
    const note = (reason || "").trim()
    if (!note) return
    onDecision(leaveId, "reject", note)
    setOpen(false)
  }

  return (
    <>
      <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Decision note (optional)"
            {...register("decision_note")}
            className="w-full"
            disabled={disabled}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={submitApprove} disabled={disabled} variant="default">Approve</Button>
          <Button onClick={openRejectDialog} disabled={disabled} variant="destructive">Reject</Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <h3 className="text-lg font-semibold mb-4">Reject Leave</h3>
          <div>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter rejection reason" className="min-h-30" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
