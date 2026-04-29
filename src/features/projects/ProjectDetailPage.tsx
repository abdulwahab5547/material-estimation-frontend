import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Calculator, Cog, Box, History, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProjectExplorer, type Selection } from "./ProjectExplorer";
import { ProjectSettingsCard } from "./ProjectSettingsCard";
import { ProjectRatesCard } from "./ProjectRatesCard";
import { useProjectTree } from "./api";
import { RoomEditor } from "@/features/rooms/RoomEditor";
import { WallEditor } from "@/features/walls/WallEditor";
import { EstimatePanel } from "@/features/estimates/EstimatePanel";
import { ThreeDView } from "@/features/three-d/ThreeDView";
import { RevisionsPanel } from "@/features/revisions/RevisionsPanel";
import { ProjectAnalyticsTab } from "@/features/analytics/ProjectAnalyticsTab";
import { extractApiError } from "@/features/auth/errors";
import type { Wall } from "./types";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading, isError, error } = useProjectTree(projectId);
  const [selection, setSelection] = useState<Selection>({ kind: "project" });

  if (isLoading) return <LoadingView />;
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load project: {extractApiError(error)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left rail — explorer */}
      <aside className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card/40 backdrop-blur flex flex-col">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
          <Button asChild size="icon" variant="ghost" className="h-7 w-7">
            <Link to="/projects"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{data.project.name}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {data.project.tag}
            </div>
          </div>
        </div>
        <ProjectExplorer
          projectId={data.project.id}
          floors={data.floors}
          rooms={data.rooms}
          walls={data.walls}
          selection={selection}
          onSelect={setSelection}
        />
      </aside>

      {/* Right pane — detail */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={JSON.stringify(selection)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="mx-auto max-w-5xl px-6 py-6 lg:px-10 lg:py-8"
        >
          <DetailPane data={data} selection={selection} />
        </motion.div>
      </main>
    </div>
  );
}

function DetailPane({
  data,
  selection,
}: {
  data: NonNullable<ReturnType<typeof useProjectTree>["data"]>;
  selection: Selection;
}) {
  const { project, floors, rooms, walls } = data;

  const selectedWall = useMemo<Wall | undefined>(() => {
    if (selection.kind !== "wall") return;
    return walls.find((w) => w.id === selection.wallId);
  }, [walls, selection]);

  const selectedRoom = useMemo(() => {
    if (selection.kind === "room") return rooms.find((r) => r.id === selection.roomId);
    if (selection.kind === "wall" && selectedWall) return rooms.find((r) => r.id === selectedWall.roomId);
    return undefined;
  }, [rooms, selection, selectedWall]);

  if (selection.kind === "project") {
    return (
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
            <p className="text-sm text-muted-foreground">
              {project.client.name || "No client set"} · {project.location || "No location"}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              <Building2 className="h-3 w-3 mr-1" /> {project.numberOfFloors} floor{project.numberOfFloors === 1 ? "" : "s"}
            </Badge>
            <Badge variant="secondary">{project.brickPreset} brick · {project.mixRatio}</Badge>
          </div>
        </div>

        <TabsList>
          <TabsTrigger value="overview"><Cog className="h-3.5 w-3.5 mr-1" />Settings</TabsTrigger>
          <TabsTrigger value="estimate"><Calculator className="h-3.5 w-3.5 mr-1" />Estimate</TabsTrigger>
          <TabsTrigger value="threeD"><Box className="h-3.5 w-3.5 mr-1" />3D view</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-3.5 w-3.5 mr-1" />Analytics</TabsTrigger>
          <TabsTrigger value="revisions"><History className="h-3.5 w-3.5 mr-1" />Revisions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <ProjectSettingsCard project={project} />
          <ProjectRatesCard project={project} />
        </TabsContent>
        <TabsContent value="estimate">
          <EstimatePanel project={project} floors={floors} rooms={rooms} walls={walls} />
        </TabsContent>
        <TabsContent value="threeD">
          <ThreeDView project={project} floors={floors} rooms={rooms} walls={walls} />
        </TabsContent>
        <TabsContent value="analytics">
          <ProjectAnalyticsTab project={project} />
        </TabsContent>
        <TabsContent value="revisions">
          <RevisionsPanel project={project} />
        </TabsContent>
      </Tabs>
    );
  }

  if (selection.kind === "floor") {
    const floor = floors.find((f) => f.id === selection.floorId);
    if (!floor) return null;
    const floorRooms = rooms.filter((r) => r.floorId === floor.id);
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">{floor.label || `Floor ${floor.index}`}</h2>
        <p className="text-sm text-muted-foreground">
          {floorRooms.length} room{floorRooms.length === 1 ? "" : "s"} · {floor.heightFt.toFixed(1)} ft ceiling
        </p>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Select a room on the left to edit it, or add a new room from the explorer.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selection.kind === "room" && selectedRoom) {
    const roomWalls = walls.filter((w) => w.roomId === selectedRoom.id);
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">{selectedRoom.name}</h2>
        <p className="text-sm text-muted-foreground">
          {selectedRoom.shape === "rect" ? "Rectangular" : selectedRoom.shape === "L" ? "L-shaped" : "Circular"} ·
          {" "}{roomWalls.length} walls
        </p>
        <RoomEditor projectId={project.id} room={selectedRoom} walls={roomWalls} />
      </div>
    );
  }

  if (selection.kind === "wall" && selectedWall) {
    return <WallEditor project={project} wall={selectedWall} />;
  }

  return null;
}

function LoadingView() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <aside className="w-72 border-r border-border p-3 space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </aside>
      <main className="flex-1 p-8 space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </main>
    </div>
  );
}
