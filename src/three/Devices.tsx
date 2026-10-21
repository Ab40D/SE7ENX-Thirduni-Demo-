import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppStore } from '../store/app';
import { COLORS, clamp01, damp, useSimRef } from './useSimRef';
import { WINDOW } from './Room';

const ROOM_H = 4;

/* ------------------------------------------------------------------ */
/* Ceiling light                                                       */
/* ------------------------------------------------------------------ */

export function CeilingLight() {
  const simRef = useSimRef();
  const lightRef = useRef<THREE.PointLight>(null);
  const shadeRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);
  const intensity = useRef(0);

  useFrame((_, dt) => {
    const { light } = simRef.current.devices;
    const target = light.on ? (light.brightness / 100) * 11 : 0;
    intensity.current = damp(intensity.current, target, 9, dt);
    if (lightRef.current) lightRef.current.intensity = intensity.current;
    const t = clamp01(intensity.current / 11);
    if (shadeRef.current) {
      shadeRef.current.emissiveIntensity = 0.05 + t * 2.4;
    }
    if (glowRef.current) {
      glowRef.current.opacity = 0.05 + t * 0.55;
      const scale = 1 + t * 0.12;
      glowMeshRef.current?.scale.set(scale, scale, scale);
    }
  });

  const toggle = useAppStore((s) => s.dispatch);

  return (
    <group
      position={[0, ROOM_H - 0.12, -0.4]}
      onClick={(event) => {
        event.stopPropagation();
        toggle({ kind: 'light.toggle' }, 'manual');
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.16, 14]} />
        <meshStandardMaterial color={COLORS.mid} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.14, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.62, 0.2, 32]} />
        <meshStandardMaterial
          ref={shadeRef}
          color="#FAFAFA"
          roughness={0.6}
          emissive="#FFFFFF"
          emissiveIntensity={0.05}
        />
      </mesh>
      <mesh ref={glowMeshRef} position={[0, -0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial
          ref={glowRef}
          color="#FFFFFF"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -0.4, 0]}
        intensity={0}
        distance={14}
        decay={1.6}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0015}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Motorised shutter                                                   */
/* ------------------------------------------------------------------ */

const SLAT_COUNT = 14;

export function Shutter() {
  const simRef = useSimRef();
  const curtainRef = useRef<THREE.Group>(null);
  const drumRef = useRef<THREE.Mesh>(null);
  const handleRef = useRef<THREE.Mesh>(null);

  const height = WINDOW.y1 - WINDOW.y0;
  const width = WINDOW.x1 - WINDOW.x0;

  useFrame(() => {
    const { shutter } = simRef.current.devices;
    const openness = clamp01(shutter.position / 100);
    const curtainHeight = height * (1 - openness);
    const step = curtainHeight / SLAT_COUNT;
    const group = curtainRef.current;
    if (group) {
      group.children.forEach((child, index) => {
        const slat = child as THREE.Mesh;
        const y = WINDOW.y1 - (index + 0.5) * step;
        slat.position.y = y;
        slat.scale.y = Math.max(step / 0.115, 0.0001);
        slat.visible = curtainHeight > 0.02;
      });
      const handle = handleRef.current;
      if (handle) {
        handle.position.y = WINDOW.y1 - curtainHeight;
        handle.visible = curtainHeight > 0.02;
      }
    }
    if (drumRef.current) {
      drumRef.current.scale.setScalar(0.7 + openness * 0.9);
    }
  });

  const toggle = useAppStore((s) => s.dispatch);

  return (
    <group position={[0, 0, WINDOW.z + 0.17]}>
      {/* rolled drum at the top */}
      <mesh ref={drumRef} position={[0, WINDOW.y1 + 0.1, 0.02]} castShadow>
        <boxGeometry args={[width + 0.06, 0.16, 0.13]} />
        <meshStandardMaterial color="#9a9a9a" roughness={0.6} metalness={0.25} />
      </mesh>

      {/* curtain */}
      <group ref={curtainRef}>
        {Array.from({ length: SLAT_COUNT }).map((_, index) => (
          <mesh key={index} position={[0, WINDOW.y1, 0]} castShadow>
            <boxGeometry args={[width, 0.115, 0.05]} />
            <meshStandardMaterial color={index % 2 ? '#E6E6E6' : '#DCDCDC'} roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* bottom rail */}
      <mesh ref={handleRef} position={[0, WINDOW.y1, 0.04]} castShadow>
        <boxGeometry args={[width + 0.04, 0.07, 0.09]} />
        <meshStandardMaterial color={COLORS.dark} roughness={0.45} />
      </mesh>

      {/* invisible click target over the window */}
      <mesh
        position={[0, (WINDOW.y0 + WINDOW.y1) / 2, 0.12]}
        onClick={(event) => {
          event.stopPropagation();
          const { shutter } = useAppStore.getState().sim.devices;
          const target = shutter.position > 50 ? 0 : 100;
          toggle({ kind: 'shutter.position', value: target }, 'manual');
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Wall switch                                                         */
/* ------------------------------------------------------------------ */

export function WallSwitch() {
  const simRef = useSimRef();
  const rockerRef = useRef<THREE.Mesh>(null);
  const toggle = useAppStore((s) => s.dispatch);

  useFrame(() => {
    const { light } = simRef.current.devices;
    if (rockerRef.current) {
      const target = light.on ? -0.22 : 0.22;
      rockerRef.current.rotation.x = damp(rockerRef.current.rotation.x, target, 14, 1 / 60);
    }
  });

  return (
    <group
      position={[-3.93, 1.28, 0.15]}
      rotation={[0, Math.PI / 2, 0]}
      onClick={(event) => {
        event.stopPropagation();
        toggle({ kind: 'light.toggle' }, 'manual');
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.24, 0.02]} />
        <meshStandardMaterial color="#FDFDFD" roughness={0.6} />
      </mesh>
      <mesh ref={rockerRef} position={[0, 0, 0.022]}>
        <boxGeometry args={[0.09, 0.13, 0.02]} />
        <meshStandardMaterial color={COLORS.dark} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Smart plug + desk lamp                                              */
/* ------------------------------------------------------------------ */

export function SmartPlug() {
  const simRef = useSimRef();
  const ledRef = useRef<THREE.MeshStandardMaterial>(null);
  const shadeRef = useRef<THREE.MeshStandardMaterial>(null);
  const plugLightRef = useRef<THREE.PointLight>(null);
  const toggle = useAppStore((s) => s.dispatch);

  useFrame((_, dt) => {
    const { plug } = simRef.current.devices;
    const target = plug.on ? 1 : 0;
    if (plugLightRef.current) {
      plugLightRef.current.intensity = damp(plugLightRef.current.intensity, target * 1.4, 8, dt);
    }
    if (ledRef.current) {
      ledRef.current.emissiveIntensity = damp(ledRef.current.emissiveIntensity, target * 2.6, 10, dt);
    }
    if (shadeRef.current) {
      shadeRef.current.emissiveIntensity = damp(shadeRef.current.emissiveIntensity, target * 1.6, 10, dt);
    }
  });

  return (
    <group position={[-2.15, 0.77, -2.6]}>
      {/* smart plug */}
      <group
        onClick={(event) => {
          event.stopPropagation();
          toggle({ kind: 'plug.toggle' }, 'manual');
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.12, 0.12]} />
          <meshStandardMaterial color="#F7F7F7" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.02, 0.063]}>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshStandardMaterial
            ref={ledRef}
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={0}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* desk lamp driven by the plug */}
      <group position={[0.75, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.03, 20]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.22, 0]} rotation={[0, 0, -0.18]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.45, 10]} />
          <meshStandardMaterial color={COLORS.dark} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[-0.07, 0.44, 0]} rotation={[0, 0, 0.5]} castShadow>
          <coneGeometry args={[0.13, 0.2, 18, 1, true]} />
          <meshStandardMaterial
            ref={shadeRef}
            color="#EFEFEF"
            emissive="#FFFFFF"
            emissiveIntensity={0}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        <pointLight
          ref={plugLightRef}
          position={[-0.12, 0.36, 0]}
          intensity={0}
          distance={2.4}
          decay={2}
          color="#FFFFFF"
        />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Presence sensor                                                     */
/* ------------------------------------------------------------------ */

export function PresenceSensor() {
  const simRef = useSimRef();
  const ledRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, dt) => {
    const { occupancy } = simRef.current.devices;
    if (ledRef.current) {
      ledRef.current.emissiveIntensity = damp(
        ledRef.current.emissiveIntensity,
        occupancy.occupied ? 1.8 : 0,
        8,
        dt,
      );
    }
  });

  return (
    <group position={[1.4, ROOM_H - 0.06, 1.6]}>
      <mesh>
        <cylinderGeometry args={[0.11, 0.11, 0.05, 20]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.028, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.035, 16]} />
        <meshStandardMaterial
          ref={ledRef}
          color="#FFFFFF"
          emissive="#FFFFFF"
          emissiveIntensity={0}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
