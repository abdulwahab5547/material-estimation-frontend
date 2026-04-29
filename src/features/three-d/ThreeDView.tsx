import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Box,
  Camera,
  Flame,
  Grid3x3,
  Layers3,
  Maximize2,
  Sparkles,
  SunMedium,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { Scene, type SceneHandle } from "./Scene";
import type { DisplayMode } from "./WallMesh";
import type { Floor, Project, Room, Wall } from "@/features/projects/types";

interface Props {
  project: Project;
  floors: Floor[];
  rooms: Room[];
  walls: Wall[];
}

/**
 * The page-level 3D view. Renders the R3F canvas with a floating
 * control panel. Falls back to a 2D notice when WebGL is missing.
 */
export function ThreeDView({ project, floors, rooms, walls }: Props) {
  const [mode, setMode] = useState<DisplayMode>("solid");
  const [heatmap, setHeatmap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ok = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      setWebglAvailable(ok);
    } catch {
      setWebglAvailable(false);
    }
  }, []);

  function screenshot() {
    const url = sceneRef.current?.captureScreenshot();
    if (!url) {
      toast.error("Could not capture — try refreshing the 3D view.");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "_")}-3d.png`;
    a.click();
    toast.success("Screenshot saved");
  }

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  if (walls.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold">Nothing to render yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add at least one room with walls to see the 3D view.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!webglAvailable) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          This device doesn't support WebGL. Try the estimate tab for the numeric breakdown, or open this page on a desktop browser.
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-xl border border-border overflow-hidden bg-background",
        isFullscreen ? "h-screen" : "h-[calc(100vh-14rem)]",
      )}
    >
      <Scene
        ref={sceneRef}
        floors={floors}
        rooms={rooms}
        walls={walls}
        mode={mode}
        heatmap={heatmap}
        numberOfFloors={project.numberOfFloors}
        params={{
          brickPreset: project.brickPreset,
          mixRatio: project.mixRatio,
          wastagePct: project.wastagePct,
          mortarJointMm: project.mortarJointMm,
        }}
      />

      {/* Top-left: title + stats */}
      <div className="absolute top-3 left-3 rounded-lg border border-border/60 bg-card/80 backdrop-blur px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold">{project.name}</span>
        </div>
        <div className="mt-1 text-muted-foreground text-[11px]">
          {project.numberOfFloors} floor{project.numberOfFloors === 1 ? "" : "s"} · {rooms.length} rooms · {walls.length} walls
        </div>
      </div>

      {/* Bottom legend for heatmap */}
      {heatmap && (
        <div className="absolute bottom-3 left-3 rounded-lg border border-border/60 bg-card/80 backdrop-blur px-3 py-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            <Flame className="h-3 w-3 text-primary" /> Brick density
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-40 rounded-full" style={{
              background: "linear-gradient(90deg, #0EA5E9 0%, #FACC15 50%, #EF4444 100%)",
            }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 w-40">
            <span>low</span><span>high</span>
          </div>
        </div>
      )}

      {/* Right-side: floating control panel */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 w-44">
        <Card className="backdrop-blur">
          <CardContent className="p-2 space-y-1">
            <div className="px-2 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Display mode
            </div>
            <ModeButton active={mode === "solid"} onClick={() => setMode("solid")} icon={Layers3} label="Solid" />
            <ModeButton active={mode === "wireframe"} onClick={() => setMode("wireframe")} icon={Grid3x3} label="Wireframe" />
            <ModeButton active={mode === "xray"} onClick={() => setMode("xray")} icon={SunMedium} label="X-ray" />
          </CardContent>
        </Card>

        <Card className="backdrop-blur">
          <CardContent className="p-2 space-y-1">
            <div className="px-2 pt-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Layers
            </div>
            <ModeButton
              active={heatmap}
              onClick={() => setHeatmap((v) => !v)}
              icon={Flame}
              label={heatmap ? "Heatmap on" : "Heatmap off"}
            />
          </CardContent>
        </Card>

        <Card className="backdrop-blur">
          <CardContent className="p-2 space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={screenshot}>
              <Camera className="h-3.5 w-3.5" /> Screenshot
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggleFullscreen}>
              <Maximize2 className="h-3.5 w-3.5" /> {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            </Button>
          </CardContent>
        </Card>

        <Badge variant="outline" className="justify-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live sync
        </Badge>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Box;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
        active
          ? "bg-primary/15 text-primary font-medium"
          : "text-foreground/80 hover:bg-secondary",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
