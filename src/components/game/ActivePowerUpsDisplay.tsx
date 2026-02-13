import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { POWER_UP_CONFIGS } from '@/types/powerup';
import { motion, AnimatePresence } from 'framer-motion';

export function ActivePowerUpsDisplay() {
  const activePowerUps = useGameStore(s => s.activePowerUps);
  const [, setTick] = useState(0);

  // Force re-render every 100ms to update countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (activePowerUps.length === 0) return null;

  return (
    <div className="absolute top-20 left-6 z-10 flex flex-col gap-2">
      <AnimatePresence>
        {activePowerUps.map(active => {
          const config = POWER_UP_CONFIGS[active.type];
          const remainingTime = Math.max(
            0,
            Math.ceil((active.expiresAt - Date.now()) / 1000)
          );
          const progress = Math.max(
            0,
            ((active.expiresAt - Date.now()) / config.duration) * 100
          );

          return (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: -50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.8 }}
              className="bg-white/90 backdrop-blur-md rounded-xl px-4 py-2 border-4 shadow-lg flex items-center gap-3 min-w-[180px]"
              style={{ borderColor: config.color }}
            >
              <span className="text-2xl">{config.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">{config.name}</span>
                  <span className="text-sm font-mono text-gray-600">
                    {remainingTime}s
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: config.color }}
                    initial={{ width: '100%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
