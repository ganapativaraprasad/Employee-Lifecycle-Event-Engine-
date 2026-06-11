import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateEmployeeStatus } from "@/services/employeeService"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string | null
  currentState?: string
  onSuccess?: () => void
  onOptimistic?: (newState: string) => void
  onError?: () => void
}

const possibleTransitions: Record<string, string[]> = {
  HIRED: ["ONBOARDING"],
  ONBOARDING: ["ACTIVE"],
  ACTIVE: ["ON_LEAVE", "TRANSFERRED", "SUSPENDED", "OFFBOARDED"],
  ON_LEAVE: ["ACTIVE", "OFFBOARDED"],
  TRANSFERRED: ["ACTIVE"],
  SUSPENDED: ["ACTIVE", "OFFBOARDED"],
  OFFBOARDED: ["ACTIVE"],
}

export default function EmployeeTransitionDialog({
  open,
  onOpenChange,
  employeeId,
  currentState,
  onSuccess,
  onOptimistic,
  onError,
}: Props) {
  const [selectedState, setSelectedState] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!employeeId || !selectedState || !reason) {
      toast.error("Please select a state and provide a reason")
      return
    }

    try {
      // optimistic update
      onOptimistic && onOptimistic(selectedState)
      setLoading(true)
      await updateEmployeeStatus(employeeId, selectedState, reason)
      toast.success("State transitioned successfully")
      onOpenChange(false)
      setSelectedState("")
      setReason("")
      onSuccess && onSuccess()
    } catch (e) {
      console.error(e)
      toast.error("Failed to transition state")
      // allow parent to revert optimistic update
      onError && onError()
    } finally {
      setLoading(false)
    }
  }

  const options = currentState ? possibleTransitions[currentState] || [] : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <h3 className="text-lg font-semibold">Transition State</h3>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-sm text-muted-foreground">Current State</label>
            <div className="mt-1 font-medium">{currentState || "-"}</div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Next State</label>
            <Select value={selectedState} onValueChange={(v) => setSelectedState(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select next state" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Reason</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for state transition"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Processing..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
