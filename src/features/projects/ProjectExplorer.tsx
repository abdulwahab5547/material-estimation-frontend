import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Layers,
  Plus,
  Trash2,
  Square,
  Shapes,
  Circle as CircleIcon,
  Columns3,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { extractApiError } from "@/features/auth/errors";

import type { Floor, Room, RoomShape, Wall } from "./types";
import { useCreateFloor, useDeleteFloor, useDeleteRoom } from "./api";
import { CreateRoomDialog } from "@/features/rooms/CreateRoomDialog";
import { ApplyTemplateDialog } from "@/features/templates/ApplyTemplateDialog";
import { BookOpen } from "lucide-react";

export type Selection =
  | { kind: "project" }
  | { kind: "floor"; floorId: string }
  | { kind: "room"; roomId: string }
  | { kind: "wall"; wallId: string };

interface Props {
  projectId: string;
  floors: Floor[];
  rooms: Room[];
  walls: Wall[];
  selection: Selection;
  onSelect: (s: Selection) => void;
}

const shapeIcon: Record<RoomShape, typeof Square> = {
  rect: Square,
  L: Shapes,
  circle: CircleIcon,
};

export function ProjectExplorer({ projectId, floors, rooms, walls, selection, onSelect }: Props) {
  const createFloor = useCreateFloor(projectId);
  const deleteFloor = useDeleteFloor(projectId);
  const deleteRoom = useDeleteRoom(projectId);

  const [openFloors, setOpenFloors] = useState<string[]>(() => floors.map((f) => f.id));

  async function handleAddFloor() {
    try {
      const floor = await createFloor.mutateAsync({});
      setOpenFloors((prev) => [...new Set([...prev, floor.id])]);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function handleDeleteFloor(f: Floor) {
    if (!confirm(`Delete ${f.label}? All its rooms and walls will be removed.`)) return;
    try {
      await deleteFloor.mutateAsync(f.id);
      if (selection.kind === "floor" && selection.floorId === f.id) onSelect({ kind: "project" });
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  async function handleDeleteRoom(r: Room) {
    if (!confirm(`Delete room "${r.name}"? Its walls will be removed.`)) return;
    try {
      await deleteRoom.mutateAsync(r.id);
      if (selection.kind === "room" && selection.roomId === r.id) onSelect({ kind: "project" });
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Project row */}
      <button
        type="button"
        onClick={() => onSelect({ kind: "project" })}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm mx-2 mt-2",
          selection.kind === "project"
            ? "bg-primary/15 text-primary font-medium"
            : "hover:bg-secondary text-foreground/80",
        )}
      >
        <Building2 className="h-4 w-4" />
        <span className="truncate">Project overview</span>
      </button>

      <div className="mt-2 flex-1 overflow-auto px-2">
        <Accordion type="multiple" value={openFloors} onValueChange={setOpenFloors} className="space-y-1">
          {floors.map((floor) => {
            const floorRooms = rooms.filter((r) => r.floorId === floor.id);
            return (
              <AccordionItem
                key={floor.id}
                value={floor.id}
                className="border-0 rounded-md bg-card/40 overflow-hidden"
              >
                <div className="flex items-center gap-1 px-2">
                  <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className="h-4 w-4 text-primary" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect({ kind: "floor", floorId: floor.id });
                        }}
                        className={cn(
                          "truncate text-left",
                          selection.kind === "floor" && selection.floorId === floor.id
                            ? "text-primary font-semibold"
                            : "",
                        )}
                      >
                        {floor.label || `Floor ${floor.index}`}
                      </button>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {floorRooms.length} room{floorRooms.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <button
                    type="button"
                    className="p-1 rounded text-muted-foreground hover:text-destructive"
                    title="Delete floor"
                    onClick={() => handleDeleteFloor(floor)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <AccordionContent className="px-2 pb-2 space-y-1">
                  {floorRooms.length === 0 && (
                    <p className="text-xs text-muted-foreground px-2 py-1">No rooms yet.</p>
                  )}
                  {floorRooms.map((room) => {
                    const roomWalls = walls.filter((w) => w.roomId === room.id);
                    const Icon = shapeIcon[room.shape];
                    return (
                      <div key={room.id} className="rounded">
                        <div className="group flex items-center gap-1 rounded hover:bg-secondary/50">
                          <button
                            type="button"
                            onClick={() => onSelect({ kind: "room", roomId: room.id })}
                            className={cn(
                              "flex-1 flex items-center gap-2 px-2 py-1.5 text-left text-sm min-w-0",
                              selection.kind === "room" && selection.roomId === room.id
                                ? "text-primary font-medium"
                                : "",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{room.name}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {roomWalls.length}w
                            </span>
                          </button>
                          <button
                            type="button"
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteRoom(room)}
                            title="Delete room"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="ml-6 border-l border-border pl-2">
                          {roomWalls.map((wall) => (
                            <button
                              key={wall.id}
                              type="button"
                              onClick={() => onSelect({ kind: "wall", wallId: wall.id })}
                              className={cn(
                                "flex items-center gap-2 w-full text-left rounded px-2 py-1 text-xs",
                                selection.kind === "wall" && selection.wallId === wall.id
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                              )}
                            >
                              <Columns3 className="h-3 w-3" />
                              <span className="truncate">{wall.label || "Wall"}</span>
                              <span className="ml-auto opacity-70">
                                {wall.lengthFt.toFixed(1)}ft
                                {wall.openings.length > 0 && ` · ${wall.openings.length}op`}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-1">
                    <CreateRoomDialog
                      projectId={projectId}
                      floorId={floor.id}
                      trigger={
                        <Button variant="ghost" size="sm" className="flex-1 justify-start text-xs">
                          <Plus className="h-3 w-3" /> Add room
                        </Button>
                      }
                    />
                    <ApplyTemplateDialog
                      projectId={projectId}
                      floorId={floor.id}
                      trigger={
                        <Button variant="ghost" size="sm" className="text-xs" title="Insert from template">
                          <BookOpen className="h-3 w-3" />
                        </Button>
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <div className="border-t border-border p-2">
        <Button variant="outline" size="sm" className="w-full" onClick={handleAddFloor} disabled={createFloor.isPending}>
          {createFloor.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add floor
        </Button>
      </div>
    </div>
  );
}
