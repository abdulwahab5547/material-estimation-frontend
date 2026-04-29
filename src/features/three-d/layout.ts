import type { Floor, LGeometry, RectGeometry, Room, RoomShape, Wall } from "@/features/projects/types";

/**
 * Translates the abstract project tree into concrete 3D placement info:
 *  - Each room gets an (x, z) origin on its floor.
 *  - Each wall gets a position + rotation so it sits correctly on the room perimeter.
 *
 * Rooms are packed row-major on each floor. The floor slab is sized to contain all rooms
 * with a bit of padding. Y stacking is driven by accumulated floor heights.
 *
 * Everything here works in FEET — the scene unit. 1 three.js unit = 1 ft.
 */

export interface LaidOutOpening {
  type: "door" | "window" | "lintel";
  widthFt: number;
  heightFt: number;
  /** offset along the wall length in feet (center of the opening) */
  offsetAlongFt: number;
  /** bottom Y in feet from floor */
  sillFt: number;
}

export interface LaidOutWall {
  id: string;
  /** world position of the wall's left-bottom corner at the inner face */
  positionX: number;
  positionY: number;
  positionZ: number;
  /** rotation around Y (radians) — direction the wall runs in */
  rotationY: number;
  lengthFt: number;
  heightFt: number;
  thicknessFt: number;
  isCurved: boolean;
  /** radius (only for curved walls from circular rooms) */
  curvedRadiusFt?: number;
  openings: LaidOutOpening[];
  bricksForHeatmap: number;
}

export interface LaidOutRoom {
  id: string;
  name: string;
  shape: RoomShape;
  originX: number;
  originZ: number;
  /** AABB size */
  footprintX: number;
  footprintZ: number;
  walls: LaidOutWall[];
}

export interface LaidOutFloor {
  id: string;
  index: number;
  label: string;
  baseY: number;
  heightFt: number;
  footprintX: number;
  footprintZ: number;
  rooms: LaidOutRoom[];
}

export interface LaidOutBuilding {
  floors: LaidOutFloor[];
  /** overall building footprint — useful for camera framing */
  extentX: number;
  extentZ: number;
  totalHeightFt: number;
}

const ROOM_GAP_FT = 3;
const ROW_WRAP_WIDTH_FT = 60;

export function layoutBuilding(
  floors: Floor[],
  rooms: Room[],
  walls: Wall[],
  perWallBricks: Map<string, number> = new Map(),
): LaidOutBuilding {
  let accY = 0;
  let extentX = 0;
  let extentZ = 0;

  const laidFloors: LaidOutFloor[] = floors
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((floor) => {
      const floorRooms = rooms.filter((r) => r.floorId === floor.id);
      const packed = packRooms(floorRooms, walls, perWallBricks);

      const fFloor: LaidOutFloor = {
        id: floor.id,
        index: floor.index,
        label: floor.label,
        baseY: accY,
        heightFt: floor.heightFt,
        footprintX: Math.max(packed.extentX, 1),
        footprintZ: Math.max(packed.extentZ, 1),
        rooms: packed.rooms,
      };

      accY += floor.heightFt;
      extentX = Math.max(extentX, fFloor.footprintX);
      extentZ = Math.max(extentZ, fFloor.footprintZ);

      return fFloor;
    });

  return {
    floors: laidFloors,
    extentX: Math.max(extentX, 10),
    extentZ: Math.max(extentZ, 10),
    totalHeightFt: accY,
  };
}

// --------------------------------------------------------------------------
// Per-floor room packing — simple row-wrap grid.
// --------------------------------------------------------------------------

function packRooms(
  rooms: Room[],
  allWalls: Wall[],
  perWallBricks: Map<string, number>,
): { rooms: LaidOutRoom[]; extentX: number; extentZ: number } {
  const laid: LaidOutRoom[] = [];
  let cursorX = 0;
  let cursorZ = 0;
  let rowMaxDepth = 0;
  let totalExtentX = 0;

  for (const room of rooms) {
    const aabb = roomAABB(room);
    if (cursorX + aabb.x > ROW_WRAP_WIDTH_FT && cursorX > 0) {
      cursorZ += rowMaxDepth + ROOM_GAP_FT;
      cursorX = 0;
      rowMaxDepth = 0;
    }

    const roomWalls = allWalls.filter((w) => w.roomId === room.id);
    const wallsLaidOut = layOutWallsForRoom(room, roomWalls, cursorX, cursorZ, perWallBricks);

    laid.push({
      id: room.id,
      name: room.name,
      shape: room.shape,
      originX: cursorX,
      originZ: cursorZ,
      footprintX: aabb.x,
      footprintZ: aabb.z,
      walls: wallsLaidOut,
    });

    cursorX += aabb.x + ROOM_GAP_FT;
    rowMaxDepth = Math.max(rowMaxDepth, aabb.z);
    totalExtentX = Math.max(totalExtentX, cursorX);
  }

  const extentZ = cursorZ + rowMaxDepth;
  return { rooms: laid, extentX: totalExtentX, extentZ };
}

function roomAABB(room: Room): { x: number; z: number } {
  if (room.shape === "rect") {
    const g = room.geometry as RectGeometry;
    return { x: g.lengthFt, z: g.widthFt };
  }
  if (room.shape === "L") {
    const g = room.geometry as LGeometry;
    return { x: g.lengthFt, z: g.widthFt };
  }
  if (room.shape === "circle") {
    const g = room.geometry as { radiusFt: number };
    return { x: g.radiusFt * 2, z: g.radiusFt * 2 };
  }
  return { x: 10, z: 10 };
}

// --------------------------------------------------------------------------
// Wall placement — trace the perimeter per shape.
// --------------------------------------------------------------------------

function layOutWallsForRoom(
  room: Room,
  walls: Wall[],
  originX: number,
  originZ: number,
  perWallBricks: Map<string, number>,
): LaidOutWall[] {
  const sortedWalls = walls.slice().sort((a, b) => a.orderIndex - b.orderIndex);

  // Compute segments (x, z, rotationY, length) around the room perimeter,
  // matching the wall generator's ordering. We produce AT MOST `sortedWalls.length`
  // segments; if the wall set has been edited (e.g. user deleted a wall), we just
  // zip against the remaining walls.
  const segments = perimeterSegments(room, originX, originZ);

  return sortedWalls.map((wall, i) => {
    const seg = segments[i % segments.length] ?? segments[0];
    return {
      id: wall.id,
      positionX: seg.x,
      positionY: 0,
      positionZ: seg.z,
      rotationY: seg.rotationY,
      lengthFt: wall.lengthFt,
      heightFt: wall.heightFt,
      thicknessFt: wall.thicknessIn / 12,
      isCurved: wall.isCurved,
      curvedRadiusFt: seg.curvedRadiusFt,
      openings: distributeOpenings(wall),
      bricksForHeatmap: perWallBricks.get(wall.id) ?? 0,
    };
  });
}

interface Segment {
  x: number;
  z: number;
  rotationY: number;
  curvedRadiusFt?: number;
}

function perimeterSegments(room: Room, ox: number, oz: number): Segment[] {
  if (room.shape === "rect") {
    const g = room.geometry as RectGeometry;
    return [
      { x: ox, z: oz, rotationY: 0 }, // North — along +X
      { x: ox + g.lengthFt, z: oz, rotationY: Math.PI / 2 }, // East — along +Z
      { x: ox + g.lengthFt, z: oz + g.widthFt, rotationY: Math.PI }, // South — along -X
      { x: ox, z: oz + g.widthFt, rotationY: (3 * Math.PI) / 2 }, // West — along -Z
    ];
  }

  if (room.shape === "L") {
    const g = room.geometry as LGeometry;
    return perimeterSegmentsForL(g, ox, oz);
  }

  if (room.shape === "circle") {
    const g = room.geometry as { radiusFt: number };
    return [{ x: ox + g.radiusFt, z: oz + g.radiusFt, rotationY: 0, curvedRadiusFt: g.radiusFt }];
  }

  return [];
}

function perimeterSegmentsForL(g: LGeometry, ox: number, oz: number): Segment[] {
  const { lengthFt: L, widthFt: W } = g;
  const { corner, cutLengthFt: a, cutWidthFt: b } = g.notch;

  // Polygon vertices going clockwise based on which corner is notched.
  let pts: Array<[number, number]>;
  switch (corner) {
    case "tr":
      pts = [[0, 0], [L - a, 0], [L - a, b], [L, b], [L, W], [0, W]];
      break;
    case "tl":
      pts = [[a, 0], [L, 0], [L, W], [0, W], [0, b], [a, b]];
      break;
    case "br":
      pts = [[0, 0], [L, 0], [L, W - b], [L - a, W - b], [L - a, W], [0, W]];
      break;
    case "bl":
    default:
      pts = [[0, 0], [L, 0], [L, W], [a, W], [a, W - b], [0, W - b]];
      break;
  }

  const segs: Segment[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % pts.length];
    const dx = bx - ax;
    const dz = bz - az;
    const rotationY = Math.atan2(dz, dx);
    segs.push({ x: ox + ax, z: oz + az, rotationY });
  }
  return segs;
}

function distributeOpenings(wall: Wall): LaidOutOpening[] {
  const expanded: { type: LaidOutOpening["type"]; w: number; h: number }[] = [];
  for (const o of wall.openings) {
    for (let i = 0; i < o.count; i++) {
      expanded.push({ type: o.type, w: o.widthFt, h: o.heightFt });
    }
  }
  if (expanded.length === 0) return [];

  // Evenly space opening centers along the wall length, with a minimum edge inset.
  const n = expanded.length;
  const spacing = wall.lengthFt / (n + 1);

  return expanded.map((o, i) => {
    const sillFt =
      o.type === "door" ? 0 :
      o.type === "lintel" ? Math.max(0, wall.heightFt - o.h - 0.5) :
      Math.max(2.5, wall.heightFt / 2 - o.h / 2);
    return {
      type: o.type,
      widthFt: o.w,
      heightFt: o.h,
      offsetAlongFt: (i + 1) * spacing,
      sillFt,
    };
  });
}
