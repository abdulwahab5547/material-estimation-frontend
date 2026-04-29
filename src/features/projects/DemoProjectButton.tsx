import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building,
  Building2,
  Check,
  ChevronRight,
  Home,
  Landmark,
  Loader2,
  Sparkles,
  TreePalm,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { extractApiError } from "@/features/auth/errors";
import { useCreateDemoProject, useDemoOptions, type DemoPresetSummary } from "./api";

interface Props {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  /** Override the trigger label (defaults to "Create demo project"). */
  label?: string;
}

/**
 * Opens a picker with the available demo presets and creates the chosen one
 * on click. Each preset highlights a different slice of the app (simple vs
 * complex, residential vs commercial, different brick/mortar presets).
 */
export function DemoProjectButton({
  variant = "outline",
  size = "default",
  className,
  label = "Create demo project",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: presets, isLoading } = useDemoOptions();
  const create = useCreateDemoProject();
  const navigate = useNavigate();

  async function handlePick(preset: DemoPresetSummary) {
    setPendingId(preset.id);
    try {
      const project = await create.mutateAsync(preset.id);
      toast.success(`"${project.name}" created`);
      setOpen(false);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Wand2 className="h-4 w-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Pick a demo project
          </DialogTitle>
          <DialogDescription>
            Each preset ships with its own geometry, rate card, and saved estimate — pick whichever
            scenario you want to explore. Creating a demo adds a new project; nothing is overwritten.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : !presets || presets.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No demo presets available.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {presets.map((p) => (
              <PresetCard
                key={p.id}
                preset={p}
                onPick={() => handlePick(p)}
                disabled={create.isPending}
                loading={pendingId === p.id}
              />
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground pt-2">
          Tip: try <strong className="text-foreground">Garden Studio</strong> for a fast walkthrough,
          or <strong className="text-foreground">Meridian Offices</strong> to see the load-bearing
          rule kick in on a 3-floor build.
        </p>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------

function PresetCard({
  preset,
  onPick,
  disabled,
  loading,
}: {
  preset: DemoPresetSummary;
  onPick: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  const Icon = iconFor(preset.icon);
  const tagVariant: "default" | "warning" | "secondary" | "outline" =
    preset.tag === "commercial"
      ? "warning"
      : preset.tag === "renovation"
        ? "secondary"
        : preset.tag === "residential"
          ? "default"
          : "outline";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-4 text-left transition-colors",
        loading
          ? "border-primary/60 bg-primary/5"
          : "hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{preset.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{preset.tagline}</div>
          </div>
        </div>
        <Badge variant={tagVariant}>{preset.tag}</Badge>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>

      <ul className="space-y-1 text-[11px] text-muted-foreground">
        {preset.highlights.map((h) => (
          <li key={h} className="flex items-start gap-1.5">
            <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between pt-1 border-t border-border/60">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {preset.floorCount} floor{preset.floorCount === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {preset.roomCount} rooms
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {preset.brickPreset} · {preset.mixRatio}
          </Badge>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
            </>
          ) : (
            <>
              Use this <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Icon mapping — keeps icon knowledge client-side; backend only ships a string.
// ---------------------------------------------------------------------------

function iconFor(name: string): typeof Home {
  switch (name) {
    case "building-2":
      return Building2;
    case "building":
      return Building;
    case "landmark":
      return Landmark;
    case "tree-palm":
      return TreePalm;
    case "home":
    default:
      return Home;
  }
}
