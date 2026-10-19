import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onChange, onInput, value, defaultValue, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  const autoResize = React.useCallback(() => {
    const el = internalRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 64)}px`;
  }, []);

  React.useLayoutEffect(() => {
    autoResize();
  }, [value, defaultValue, autoResize]);

  return (
    <textarea
      ref={(node) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
        }
      }}
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex min-h-16 w-full max-w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm break-words [overflow-wrap:anywhere] whitespace-pre-wrap overflow-hidden resize-none",
        className
      )}
      value={value}
      defaultValue={defaultValue}
      onInput={(e) => {
        autoResize();
        onInput?.(e);
      }}
      onChange={(e) => {
        autoResize();
        onChange?.(e);
      }}
      {...props}
    />
  )
});

Textarea.displayName = "Textarea";

export { Textarea }

