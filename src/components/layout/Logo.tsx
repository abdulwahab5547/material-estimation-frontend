import { cn } from "@/lib/utils";

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0">
        <rect width="64" height="64" rx="12" className="fill-primary/10" />
        <path
          d="M12 44 L32 14 L52 44 Z"
          fill="none"
          className="stroke-primary"
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <path d="M12 44 H52" className="stroke-primary" strokeWidth={4} strokeLinecap="round" />
        <circle cx="32" cy="36" r="3" className="fill-primary" />
      </svg>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight">StructuraCore</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">AI · Estimation</div>
      </div>
    </div>
  );
}
