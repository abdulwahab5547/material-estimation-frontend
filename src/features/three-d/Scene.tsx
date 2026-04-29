import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls, Environment } from "@react-three/drei";
import type * as THREE from "three";

import { Building } from "./Building";
import type { DisplayMode } from "./WallMesh";
import type { Floor, Room, Wall } from "@/features/projects/types";
import type { BrickPreset, MixRatio } from "@/lib/calc/constants";
import { layoutBuilding } from "./layout";

export interface SceneHandle {
  captureScreenshot: () => string | null;
}

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

export const Scene = forwardRef<SceneHandle, Props>(function Scene(
  { floors, rooms, walls, mode, heatmap, selectedWallId, params, numberOfFloors },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      captureScreenshot: () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        try {
          return canvas.toDataURL("image/png");
        } catch {
          return null;
        }
      },
    }),
    [],
  );

  // Camera framing uses the building's bounding box
  const { extentX, extentZ, totalHeightFt } = useMemo(
    () => layoutBuilding(floors, rooms, walls),
    [floors, rooms, walls],
  );

  const camDist = Math.max(30, Math.sqrt(extentX * extentX + extentZ * extentZ) * 1.4);
  const cameraPosition: [number, number, number] = [
    extentX / 2 + camDist * 0.6,
    Math.max(totalHeightFt + 10, camDist * 0.7),
    extentZ / 2 + camDist * 0.6,
  ];
  const target: [number, number, number] = [extentX / 2, totalHeightFt / 2, extentZ / 2];

  return (
    <Canvas
      shadows
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: cameraPosition, fov: 45, near: 0.5, far: 2000 }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        canvasRef.current = gl.domElement;
      }}
    >
      <color attach="background" args={["#070C1A"]} />
      <fog attach="fog" args={["#070C1A", 60, 300]} />

      {/* Lighting: amber key + cool fill to match the brand */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[extentX + 30, totalHeightFt + 40, extentZ + 30]}
        intensity={1.0}
        color="#FDE68A"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight
        position={[-20, 20, -20]}
        intensity={0.25}
        color="#93C5FD"
      />
      <Environment preset="city" background={false} environmentIntensity={0.3} />

      <Grid
        args={[200, 200]}
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1E293B"
        sectionSize={10}
        sectionColor="#334155"
        sectionThickness={1.0}
        fadeDistance={150}
        infiniteGrid
      />

      <axesHelper args={[5]} />

      <Building
        floors={floors}
        rooms={rooms}
        walls={walls}
        mode={mode}
        heatmap={heatmap}
        selectedWallId={selectedWallId}
        params={params}
        numberOfFloors={numberOfFloors}
      />

      <OrbitControls
        target={target as unknown as THREE.Vector3 & [number, number, number]}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={5}
        maxDistance={500}
      />
    </Canvas>
  );
});
