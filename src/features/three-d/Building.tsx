import { useMemo } from "react";
import { FloorSlab } from "./FloorSlab";
import { WallMesh, type DisplayMode } from "./WallMesh";
import type { Floor, Room, Wall } from "@/features/projects/types";
import { layoutBuilding, type LaidOutWall } from "./layout";
import { runLiveEstimate, type LiveProject } from "@/lib/calc/estimate";
import type { BrickPreset, MixRatio } from "@/lib/calc/constants";

interface Props {
  floors: Floor[];
  rooms: Room[];
  walls: Wall[];
  mode: DisplayMode;
  heatmap: boolean;
  selectedWallId?: string;
  params: {
    brickPreset: BrickPreset;
    mixRatio: MixRatio;
    wastagePct: number;
    mortarJointMm: number;
  };
  numberOfFloors: number;
}

export function Building({
  floors,
  rooms,
  walls,
  mode,
  heatmap,
  selectedWallId,
  params,
  numberOfFloors,
}: Props) {
  const perWallBricks = useMemo(() => {
    const liveProject: LiveProject = {
      numberOfFloors,
      params,
      floors: floors.map((f) => ({
        id: f.id,
        index: f.index,
        label: f.label,
        rooms: rooms
          .filter((r) => r.floorId === f.id)
          .map((r) => ({
            id: r.id,
            name: r.name,
            walls: walls
              .filter((w) => w.roomId === r.id)
              .map((w) => ({
                id: w.id,
                label: w.label,
                lengthFt: w.lengthFt,
                heightFt: w.heightFt,
                thicknessIn: w.thicknessIn,
                openings: w.openings.map((o) => ({
                  widthFt: o.widthFt,
                  heightFt: o.heightFt,
                  count: o.count,
                })),
              })),
          })),
      })),
    };
    const result = runLiveEstimate(liveProject);
    return new Map(result.perWall.map((w) => [w.wallId, w.bricks]));
  }, [floors, rooms, walls, params, numberOfFloors]);

  const laidOut = useMemo(
    () => layoutBuilding(floors, rooms, walls, perWallBricks),
    [floors, rooms, walls, perWallBricks],
  );

  const maxBricks = useMemo(() => {
    let m = 0;
    for (const v of perWallBricks.values()) if (v > m) m = v;
    return m;
  }, [perWallBricks]);

  return (
    <group>
      {laidOut.floors.map((floor) => (
        <group key={floor.id}>
          <FloorSlab floor={floor} mode={mode} />
          {floor.rooms.map((room) => (
            <group key={room.id} position={[0, floor.baseY, 0]}>
              {room.walls.map((wall: LaidOutWall) => (
                <WallMesh
                  key={wall.id}
                  wall={wall}
                  mode={mode}
                  heatmap={heatmap}
                  heatIntensity={maxBricks ? wall.bricksForHeatmap / maxBricks : 0}
                  highlighted={wall.id === selectedWallId}
                />
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
