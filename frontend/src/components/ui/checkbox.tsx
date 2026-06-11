import * as React from "react"

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={"h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring " + (className || "")}
      {...props}
    />
  )
}

export { Checkbox }
