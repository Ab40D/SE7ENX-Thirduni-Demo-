import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS } from './useSimRef';

const ROOM = { w: 8, d: 8, h: 4 };
export const WINDOW = { x0: -1.7, x1: 1.7, y0: 1.0, y1: 3.25, z: -ROOM.d / 2 };
export const DOOR = { z0: -2.5, z1: -1.1, h: 2.4, x: -ROOM.w / 2 };

interface BoxProps {
  position: [number, number, number];
  args: [number, number, number];
  color?: string;
  rotation?: [number, number, number];
  roughness?: number;
  metalness?: number;
}

function Box({ position, args, color = COLORS.wall, rotation, roughness = 0.85, metalness = 0 }: BoxProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

/** Architectural wireframe that fades while the solid room assembles. */
export function GhostOutline({ opacity }: { opacity: number }) {
  const geometry = useMemo(() => {
    const group = new THREE.Group();
    const box = new THREE.BoxGeometry(ROOM.w, ROOM.h, ROOM.d);
    const edges = new THREE.EdgesGeometry(box);
    group.userData.edges = edges;
    return edges;
  }, []);

  return (
    <lineSegments geometry={geometry} position={[0, ROOM.h / 2, 0]}>
      <lineBasicMaterial color={COLORS.line} transparent opacity={opacity} />
    </lineSegments>
  );
}

export function FloorGrid({ opacity }: { opacity: number }) {
  const geometry = useMemo(() => {
    const points: number[] = [];
    const step = 1;
    for (let x = -ROOM.w / 2; x <= ROOM.w / 2; x += step) {
      points.push(x, 0.002, -ROOM.d / 2, x, 0.002, ROOM.d / 2);
    }
    for (let z = -ROOM.d / 2; z <= ROOM.d / 2; z += step) {
      points.push(-ROOM.w / 2, 0.002, z, ROOM.w / 2, 0.002, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={COLORS.line} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  );
}

export function Shell({ assemble }: { assemble: number }) {
  // assemble: 0 → nothing, 1 → fully built.
  const t = (start: number, duration = 0.3) =>
    THREE.MathUtils.clamp((assemble - start) / duration, 0, 1);

  const floorT = t(0.15);
  const wallT = t(0.25);
  const ceilingT = t(0.5);

  return (
    <group>
      {/* Floor */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        scale={[Math.max(floorT, 0.001), Math.max(floorT, 0.001), 1]}
        visible={floorT > 0.001}
      >
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.95} />
      </mesh>

      {/* Back wall with window opening, built from four panels */}
      <group visible={wallT > 0.001}>
        <Box
          position={[-2.85, ROOM.h / 2, -ROOM.d / 2]}
          args={[2.3, ROOM.h, 0.12]}
          color={COLORS.wall}
        />
        <Box
          position={[2.85, ROOM.h / 2, -ROOM.d / 2]}
          args={[2.3, ROOM.h, 0.12]}
          color={COLORS.wall}
        />
        <Box
          position={[0, (WINDOW.y1 + ROOM.h) / 2, -ROOM.d / 2]}
          args={[WINDOW.x1 - WINDOW.x0, ROOM.h - WINDOW.y1, 0.12]}
          color={COLORS.wall}
        />
        <Box
          position={[0, WINDOW.y0 / 2, -ROOM.d / 2]}
          args={[WINDOW.x1 - WINDOW.x0, WINDOW.y0, 0.12]}
          color={COLORS.wall}
        />
      </group>

      {/* Left wall with door opening */}
      <group visible={wallT > 0.001}>
        <Box
          position={[-ROOM.w / 2, ROOM.h / 2, -3.3]}
          args={[0.12, ROOM.h, 1.4]}
          color={COLORS.wallShade}
        />
        <Box
          position={[-ROOM.w / 2, ROOM.h / 2, 2.75]}
          args={[0.12, ROOM.h, 2.5]}
          color={COLORS.wallShade}
        />
        <Box
          position={[-ROOM.w / 2, (DOOR.h + ROOM.h) / 2, -1.8]}
          args={[0.12, ROOM.h - DOOR.h, 1.4]}
          color={COLORS.wallShade}
        />
      </group>

      {/* Section cut along the open sides: the room reads as a cut-away model */}
      <Box position={[ROOM.w / 2, 0.03, 0]} args={[0.07, 0.06, ROOM.d]} color="#6f6f6f" />
      <Box position={[0, 0.03, ROOM.d / 2]} args={[ROOM.w, 0.06, 0.07]} color="#6f6f6f" />

      {/* Ceiling */}
      <mesh
        position={[0, ROOM.h, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        visible={ceilingT > 0.001}
        scale={[Math.max(ceilingT, 0.001), Math.max(ceilingT, 0.001), 1]}
      >
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {/* Skirting */}
      <Box position={[0, 0.05, -ROOM.d / 2 + 0.07]} args={[ROOM.w, 0.1, 0.03]} color={COLORS.soft} />
      <Box position={[-ROOM.w / 2 + 0.07, 0.05, 0]} args={[0.03, 0.1, ROOM.d]} color={COLORS.soft} />
    </group>
  );
}

export function Door() {
  return (
    <group position={[DOOR.x + 0.07, 0, (DOOR.z0 + DOOR.z1) / 2]}>
      <mesh position={[0, DOOR.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.07, DOOR.h + 0.06, DOOR.z1 - DOOR.z0 + 0.1]} />
        <meshStandardMaterial color={COLORS.mid} roughness={0.6} />
      </mesh>
      <mesh position={[0.05, 1.05, 0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.22, 12]} />
        <meshStandardMaterial color={COLORS.dark} roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[0.05, 1.05, 0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.22, 12]} />
        <meshStandardMaterial color={COLORS.dark} roughness={0.35} metalness={0.6} />
      </mesh>
    </group>
  );
}

export function WindowFrame() {
  const frame = COLORS.dark;
  const width = WINDOW.x1 - WINDOW.x0;
  const height = WINDOW.y1 - WINDOW.y0;
  return (
    // The frame is pushed slightly forward of the wall and overlaps it, so no
    // face is ever coplanar with the wall panels (which would z-fight).
    <group position={[0, 0, WINDOW.z + 0.03]}>
      <Box position={[0, WINDOW.y1 + 0.04, 0]} args={[width + 0.24, 0.12, 0.14]} color={frame} />
      <Box position={[0, WINDOW.y0 - 0.04, 0]} args={[width + 0.24, 0.12, 0.14]} color={frame} />
      <Box position={[WINDOW.x0 - 0.04, (WINDOW.y0 + WINDOW.y1) / 2, 0]} args={[0.12, height + 0.24, 0.14]} color={frame} />
      <Box position={[WINDOW.x1 + 0.04, (WINDOW.y0 + WINDOW.y1) / 2, 0]} args={[0.12, height + 0.24, 0.14]} color={frame} />
      <Box position={[0, (WINDOW.y0 + WINDOW.y1) / 2, 0.02]} args={[0.06, height, 0.1]} color={frame} />
    </group>
  );
}

export function DaylightPanel() {
  return (
    <mesh position={[0, (WINDOW.y0 + WINDOW.y1) / 2, WINDOW.z - 0.5]}>
      <planeGeometry args={[WINDOW.x1 - WINDOW.x0 + 0.4, WINDOW.y1 - WINDOW.y0 + 0.4]} />
      <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
    </mesh>
  );
}

export function Furniture() {
  return (
    <group>
      {/* Rug */}
      <mesh position={[2.2, 0.012, -1.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, 2.6]} />
        <meshStandardMaterial color="#EDEDED" roughness={1} />
      </mesh>
      <mesh position={[2.2, 0.016, -1.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.7, 48]} />
        <meshStandardMaterial color={COLORS.soft} roughness={1} />
      </mesh>

      {/* Sofa against the back wall, facing the room */}
      <group position={[2.35, 0, -3.1]}>
        <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.45, 0.95]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.75, -0.38]} castShadow>
          <boxGeometry args={[2.4, 0.85, 0.22]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.9} />
        </mesh>
        <mesh position={[-1.1, 0.62, 0]} castShadow>
          <boxGeometry args={[0.2, 0.55, 0.95]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.9} />
        </mesh>
        <mesh position={[1.1, 0.62, 0]} castShadow>
          <boxGeometry args={[0.2, 0.55, 0.95]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.9} />
        </mesh>
        <mesh position={[-0.55, 0.62, 0.02]} castShadow>
          <boxGeometry args={[0.9, 0.16, 0.8]} />
          <meshStandardMaterial color={COLORS.mid} roughness={1} />
        </mesh>
        <mesh position={[0.55, 0.62, 0.02]} castShadow>
          <boxGeometry args={[0.9, 0.16, 0.8]} />
          <meshStandardMaterial color={COLORS.mid} roughness={1} />
        </mesh>
      </group>

      {/* Coffee table */}
      <group position={[2.2, 0, -1.7]}>
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.06, 0.7]} />
          <meshStandardMaterial color={COLORS.mid} roughness={0.7} />
        </mesh>
        <mesh position={[-0.55, 0.18, -0.26]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.36, 10]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0.55, 0.18, -0.26]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.36, 10]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[-0.55, 0.18, 0.26]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.36, 10]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0.55, 0.18, 0.26]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.36, 10]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0.2, 0.44, 0]} castShadow>
          <boxGeometry args={[0.26, 0.08, 0.2]} />
          <meshStandardMaterial color="#E9E9E9" roughness={1} />
        </mesh>
      </group>

      {/* Desk near the window */}
      <group position={[-2.8, 0, -2.7]}>
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.06, 0.75]} />
          <meshStandardMaterial color="#EDEDED" roughness={0.8} />
        </mesh>
        <mesh position={[-0.85, 0.37, 0]} castShadow>
          <boxGeometry args={[0.06, 0.74, 0.7]} />
          <meshStandardMaterial color={COLORS.mid} roughness={0.8} />
        </mesh>
        <mesh position={[0.85, 0.37, 0]} castShadow>
          <boxGeometry args={[0.06, 0.74, 0.7]} />
          <meshStandardMaterial color={COLORS.mid} roughness={0.8} />
        </mesh>
        {/* chair */}
        <group position={[0, 0, 0.75]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.5, 0.06, 0.5]} />
            <meshStandardMaterial color={COLORS.dark} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.75, -0.22]} castShadow>
            <boxGeometry args={[0.5, 0.55, 0.06]} />
            <meshStandardMaterial color={COLORS.dark} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.44, 10]} />
            <meshStandardMaterial color={COLORS.dark} roughness={0.6} metalness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Shelf + books */}
      <group position={[-3.85, 1.55, 1.9]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.05, 0.3]} />
          <meshStandardMaterial color="#EDEDED" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.05, 0.3]} />
          <meshStandardMaterial color="#EDEDED" roughness={0.8} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[-0.55 + i * 0.13, 0.2, 0]}
            rotation={[0, 0, i % 2 ? 0.12 : -0.05]}
            castShadow
          >
            <boxGeometry args={[0.08, 0.32, 0.2]} />
            <meshStandardMaterial color={i % 2 ? COLORS.mid : COLORS.dark} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Plant */}
      <group position={[-3.25, 0, 3.1]}>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.19, 0.4, 20]} />
          <meshStandardMaterial color={COLORS.mid} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          <meshStandardMaterial color={COLORS.soft} roughness={1} />
        </mesh>
        {[
          { p: [0.1, 0.66, 0.02] as [number, number, number], r: [0.1, 0.4, 0.16] as [number, number, number] },
          { p: [-0.09, 0.6, -0.04] as [number, number, number], r: [-0.18, 0.9, -0.2] as [number, number, number] },
          { p: [0.02, 0.78, -0.06] as [number, number, number], r: [0.25, 0.2, 0.1] as [number, number, number] },
        ].map((leaf, index) => (
          <mesh key={index} position={leaf.p} rotation={leaf.r} castShadow>
            <coneGeometry args={[0.09, 0.36, 8]} />
            <meshStandardMaterial color={index === 1 ? COLORS.soft : COLORS.mid} roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
