import * as React from "react";
import { Calendar } from "lucide-react";

import { Input } from "@components/ui/input";
import { cn } from "@utils";

const DateInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type">
>(({ className, ...props }, ref) => {
  return (
    <div className="relative">
      <Input
        type="date"
        ref={ref}
        className={cn(
          // Stretch the native picker indicator over the whole field and hide
          // it, so clicking anywhere opens the picker while our own icon shows.
          "pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
          className,
        )}
        {...props}
      />
      <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
});
DateInput.displayName = "DateInput";

export { DateInput };
