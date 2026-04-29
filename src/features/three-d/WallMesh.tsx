import { useMemo } from "react";
import * as THREE from "three";
import type { LaidOutWall } from "./layout";

export type DisplayMode = "solid" | "wireframe" | "xray";

interface Props {
  wall: LaidOutWall;
  /** for heatmap coloring — relative 0..1 intensity */
  heatIntensity?: number;
  heatmap: boolean;
  mode: DisplayMode;
  /** highlight this wall (selected in explorer) */
  highlighted?: boolean;
}

/**
 * A wall is built as an extruded 2D profile: the wall face outline, with
 * rectangular holes cut out for each opening. Three.js `ExtrudeGeometry`
 * supports polygon holes natively, so we avoid heavy CSG libraries.
 *
 * Coordinate convention for the extruded profile (local to the wall):
 *   - X axis runs along the wall's length
 *   - Y axis runs up (height)
 *   - extrusion depth = thicknessFt (forward along +Z after rotation)
 *
 * After construction, the mesh is positioned in world space using the
 * layout's (positionX, positionZ, rotationY).
 */
export function WallMesh({ wall, heatIntensity = 0, heatmap, mode, highlighted }: Props) {
  // Build flat-wall geometry once per relevant input change. Hooks must run
  // unconditionally, so this is called even for curved walls (we then ignore it).
  const geometry = useMemo(() => {
    if (wall.isCurved) return null;
    const L = wall.lengthFt;
    const H = wall.heightFt;

    const face = new THREE.Shape();
    face.moveTo(0, 0);
    face.lineTo(L, 0);
    face.lineTo(L, H);
    face.lineTo(0, H);
    face.lineTo(0, 0);

    for (const o of wall.openings) {
      const half = o.widthFt / 2;
      const left = Math.max(0.1, o.offsetAlongFt - half);
      const right = Math.min(L - 0.1, o.offsetAlongFt + half);
      const bottom = Math.max(0, o.sillFt);
      const top = Math.min(H, bottom + o.heightFt);
      if (right <= left || top <= bottom) continue;

      const hole = new THREE.Path();
      hole.moveTo(left, bottom);
      hole.lineTo(right, bottom);
      hole.lineTo(right, top);
      hole.lineTo(left, top);
      hole.lineTo(left, bottom);
      face.holes.push(hole);
    }

    return new THREE.ExtrudeGeometry(face, {
      depth: wall.thicknessFt,
      bevelEnabled: false,
      curveSegments: 6,
    });
  }, [wall.isCurved, wall.lengthFt, wall.heightFt, wall.thicknessFt, wall.openings]);

  const color = heatmap ? heatColor(heatIntensity) : highlighted ? "#F59E0B" : "#B4C9E8";

  if (wall.isCurved && wall.curvedRadiusFt) {
    return (
      <CurvedWall wall={wall} color={color} mode={mode} />
    );
  }

  if (!geometry) return null;

  return (
    <group
      position={[wall.positionX, wall.positionY, wall.positionZ]}
      rotation={[0, -wall.rotationY, 0]}
    >
      <mesh geometry={geometry} castShadow receiveShadow>
        {mode === "solid" ? (
          <meshStandardMaterial color={color} roughness={0.9} metalness={0.02} />
        ) : mode === "xray" ? (
          <meshStandardMaterial color={color} transparent opacity={0.35} roughness={0.9} />
        ) : (
          <meshBasicMaterial color="#F59E0B" wireframe />
        )}
      </mesh>
      {/* Always-visible edge outline for the blueprint look */}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial
          color={highlighted ? "#FDE68A" : "#F59E0B"}
          opacity={mode === "wireframe" ? 0 : 0.7}
          transparent
        />
      </lineSegments>
    </group>
  );
}

// -------------------------------------------------------------------------
// Curved wall (circular rooms)
// -------------------------------------------------------------------------

function CurvedWall({ wall, color, mode }: { wall: LaidOutWall; color: string; mode: DisplayMode }) {
  const radius = wall.curvedRadiusFt ?? 5;

  return (
    <group position={[wall.positionX - radius, 0, wall.positionZ - radius]}>
      <mesh position={[radius, wall.heightFt / 2, radius]}>
        <cylinderGeometry args={[radius, radius, wall.heightFt, 48, 1, true]} />
        {mode === "wireframe" ? (
          <meshBasicMaterial color="#F59E0B" wireframe side={THREE.DoubleSide} />
        ) : mode === "xray" ? (
          <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
        ) : (
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.9} />
        )}
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------------------
// Heatmap color ramp (viridis-ish, simple 3-stop gradient)
// -------------------------------------------------------------------------

export function heatColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  // cyan → amber → red
  const a = new THREE.Color("#0EA5E9");
  const b = new THREE.Color("#FACC15");
  const c = new THREE.Color("#EF4444");
  if (clamped < 0.5) return a.lerp(b, clamped * 2).getStyle();
  return b.lerp(c, (clamped - 0.5) * 2).getStyle();
}
