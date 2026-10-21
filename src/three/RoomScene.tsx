import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CeilingLight, PresenceSensor, Shutter, SmartPlug, WallSwitch } from './Devices';
import { DaylightPanel, Door, FloorGrid, Furniture, GhostOutline, Shell, WindowFrame } from './Room';
import { COLORS, clamp01, damp, useSimRef } from './useSimRef';

interface SceneProps {
  /** 0 → nothing built, 1 → complete room. */
  assemble: number;
  /** while true the camera performs the intro dolly */
  introActive: boolean;
  shadows: boolean;
}

function Lighting({ shadows }: { shadows: boolean }) {
  const simRef = useSimRef();
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const patchRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const { ambient, shutter } = simRef.current.devices;
    const openness = clamp01(shutter.position / 100);
    const daylight = (ambient.level / 100) * openness;

    if (hemiRef.current) {
      hemiRef.current.intensity = damp(hemiRef.current.intensity, 0.18 + (ambient.level / 100) * 0.9, 6, dt);
    }
    if (sunRef.current) {
      sunRef.current.intensity = damp(sunRef.current.intensity, daylight * 2.6, 6, dt);
      sunRef.current.position.set(-2.4 + openness * 1.6, 4.6, -8);
    }
    if (patchRef.current) {
      const material = patchRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = damp(material.opacity, daylight * 0.55, 6, dt);
      const s = 0.5 + daylight * 0.8;
      patchRef.current.scale.set(s, s, 1);
      patchRef.current.position.z = -2.2 + openness * 1.4;
    }
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={['#ffffff', '#cfcfcf', 0.5]} />
      <ambientLight intensity={0.16} />
      <directionalLight
        ref={sunRef}
        position={[-2.4, 4.6, -8]}
        intensity={0.6}
        color="#ffffff"
        castShadow={shadows}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.001}
      />
      {/* Daylight patch projected on the floor */}
      <mesh ref={patchRef} position={[0.4, 0.02, -2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 2.6]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

function CameraRig({ introActive, assemble }: { introActive: boolean; assemble: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame((_, dt) => {
    if (!introActive) return;
    const t = clamp01((assemble - 0.15) / 0.75);
    const eased = 1 - Math.pow(1 - t, 3);
    target.current.set(8.4 - eased * 2.1, 5.2 - eased * 1.9, 9.6 - eased * 2.0);
    camera.position.lerp(target.current, 1 - Math.exp(-2.4 * Math.min(dt, 0.1)));
    camera.lookAt(0, 1.35, -1.2);
  });

  return null;
}

function SceneContents({ assemble, introActive, shadows }: SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const ghostOpacity = Math.max(0, 0.5 - assemble * 0.6);

  return (
    <>
      <color attach="background" args={['#EDEDED']} />
      <fog attach="fog" args={['#EDEDED', 16, 30]} />
      <Lighting shadows={shadows} />
      <CameraRig introActive={introActive} assemble={assemble} />

      <group>
        <GhostOutline opacity={ghostOpacity} />
        <FloorGrid opacity={0.1 + (1 - assemble) * 0.35} />
        <Shell assemble={assemble} />
        <DaylightPanel />
        <WindowFrame />
        <Door />
        <Furniture />
        <CeilingLight />
        <Shutter />
        <WallSwitch />
        <SmartPlug />
        <PresenceSensor />
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={4.2}
        maxDistance={14}
        minPolarAngle={0.32}
        maxPolarAngle={1.48}
        target={[0, 1.35, -1.2]}
      />
    </>
  );
}

export function RoomCanvas({ assemble, introActive, shadows }: SceneProps) {
  const onCreated = ({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.02;
  };

  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows={shadows}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: [6.3, 3.3, 7.6], fov: 40, near: 0.1, far: 80 }}
      onCreated={onCreated}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <SceneContents assemble={assemble} introActive={introActive} shadows={shadows} />
      </Suspense>
    </Canvas>
  );
}

/** Detects WebGL support once, so the UI can offer a 2D fallback. */
export function useWebGLSupport(): boolean | null {
  const supported = useRef<boolean | null>(null);
  useEffect(() => {
    if (supported.current !== null) return;
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl');
      supported.current = Boolean(gl);
    } catch {
      supported.current = false;
    }
  }, []);
  return supported.current;
}

export const SCENE_COLORS = COLORS;
