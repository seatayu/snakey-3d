import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { useGameStore } from '@/store/useGameStore';
import { Snake } from './Snake';
import { Food } from './Food';
import { PowerUps } from './PowerUps';
import { Board } from './Board';

function GameLoop() {
  const tick = useGameStore(s => s.tick);
  const status = useGameStore(s => s.status);
  const speed = useGameStore(s => s.speed);
  const updatePowerUpEffects = useGameStore(s => s.updatePowerUpEffects);
  const removeExpiredPowerUps = useGameStore(s => s.removeExpiredPowerUps);
  const lastTick = useRef(0);
  const lastPowerUpCheck = useRef(0);

  useFrame((state) => {
    if (status !== 'RUNNING') return;

    const now = state.clock.getElapsedTime() * 1000;

    // Game tick
    if (now - lastTick.current > speed) {
      tick();
      lastTick.current = now;
    }

    // Check power-up effects every 100ms
    if (now - lastPowerUpCheck.current > 100) {
      const currentTime = Date.now();
      updatePowerUpEffects(currentTime);
      removeExpiredPowerUps(currentTime);
      lastPowerUpCheck.current = now;
    }
  });

  return null;
}
export function Game3D() {
  return (
    <div className="w-full h-full absolute inset-0 bg-[#E0F2FE]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 15, 12]} fov={40} />
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2.5}
          minDistance={15}
          maxDistance={25}
        />
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <GameLoop />
        <Board />
        <Snake />
        <Food />
        <PowerUps />
        <ContactShadows 
          opacity={0.4} 
          scale={20} 
          blur={2.4} 
          far={20} 
          resolution={256} 
          color="#1e293b" 
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}