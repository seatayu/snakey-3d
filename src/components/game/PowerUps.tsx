import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/useGameStore';
import { Octahedron, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';
import { PowerUp as PowerUpType, POWER_UP_CONFIGS } from '@/types/powerup';

interface PowerUpItemProps {
  powerUp: PowerUpType;
}

function PowerUpItem({ powerUp }: PowerUpItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const gridSize = useGameStore(s => s.gridSize);
  const config = POWER_UP_CONFIGS[powerUp.type];
  const offset = gridSize / 2 - 0.5;

  const animationParams = useMemo(() => {
    switch (powerUp.type) {
      case 'SPEED_UP':
        return { floatIntensity: 0.8, rotationSpeed: 0.08, scale: 0.45 };
      case 'SLOW_DOWN':
        return { floatIntensity: 0.3, rotationSpeed: 0.02, scale: 0.5 };
      case 'SHRINK':
        return { floatIntensity: 0.5, rotationSpeed: 0.05, scale: 0.4 };
      default:
        return { floatIntensity: 0.5, rotationSpeed: 0.05, scale: 0.45 };
    }
  }, [powerUp.type]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += animationParams.rotationSpeed;
      meshRef.current.rotation.x += animationParams.rotationSpeed * 0.5;
    }
  });

  return (
    <Float
      speed={3}
      rotationIntensity={0.5}
      floatIntensity={animationParams.floatIntensity}
      floatingRange={[0.3, 0.8]}
    >
      <Octahedron
        ref={meshRef}
        args={[animationParams.scale, 0]}
        position={[
          powerUp.position[0] - offset,
          0.5,
          powerUp.position[1] - offset
        ]}
        castShadow
      >
        <MeshDistortMaterial
          color={config.color}
          speed={powerUp.type === 'SPEED_UP' ? 8 : 2}
          distort={powerUp.type === 'SHRINK' ? 0.6 : 0.3}
          radius={1}
          roughness={0.2}
          metalness={0.5}
          emissive={config.color}
          emissiveIntensity={0.3}
        />
      </Octahedron>
    </Float>
  );
}

export function PowerUps() {
  const powerUps = useGameStore(s => s.powerUps);

  return (
    <group>
      {powerUps.map(powerUp => (
        <PowerUpItem
          key={powerUp.id}
          powerUp={powerUp}
        />
      ))}
    </group>
  );
}
