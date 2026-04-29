import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface HealthResponse {
  status: "ok";
  uptime: number;
  db: string;
}

export function HealthPill() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data } = await api.get<HealthResponse>("/api/health");
      return data;
    },
    refetchInterval: 15_000,
    retry: 1,
  });

  const dotClass = isError
    ? "bg-destructive"
    : isLoading
      ? "bg-muted-foreground animate-pulse"
      : data?.db === "connected"
        ? "bg-emerald-400"
        : "bg-amber-400";

  const label = isError ? "API offline" : isLoading ? "Checking…" : data?.db === "connected" ? "API · DB OK" : "DB down";

  return (
    <div
      className={cn(
        "hidden sm:flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground",
      )}
      title={isError ? "Could not reach the API" : undefined}
    >
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      <span className="font-medium text-foreground/80">{label}</span>
    </div>
  );
}
