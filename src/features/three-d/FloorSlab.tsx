import type { LaidOutFloor } from "./layout";

const SLAB_THICKNESS = 0.5; // ft
const SLAB_PADDING = 2; // ft around the farthest room

export function FloorSlab({ floor, mode }: { floor: LaidOutFloor; mode: "solid" | "wireframe" | "xray" }) {
  const sizeX = floor.footprintX + SLAB_PADDING * 2;
  const sizeZ = floor.footprintZ + SLAB_PADDING * 2;

  return (
    <group position={[-SLAB_PADDING, floor.baseY, -SLAB_PADDING]}>
      <mesh position={[sizeX / 2, -SLAB_THICKNESS / 2, sizeZ / 2]} receiveShadow>
        <boxGeometry args={[sizeX, SLAB_THICKNESS, sizeZ]} />
        {mode === "wireframe" ? (
          <meshBasicMaterial color="#1E293B" wireframe />
        ) : mode === "xray" ? (
          <meshStandardMaterial color="#0B1E3F" transparent opacity={0.25} />
        ) : (
          <meshStandardMaterial color="#0B1E3F" roughness={0.95} metalness={0} />
        )}
      </mesh>
    </group>
  );
}
