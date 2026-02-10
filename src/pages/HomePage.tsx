import React, { useEffect } from 'react';
import { Game3D } from '@/components/game/Game3D';
import { MobileControls } from '@/components/game/MobileControls';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Play, RotateCcw, Pause, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export function HomePage() {
  const status = useGameStore(s => s.status);
  const score = useGameStore(s => s.score);
  const startGame = useGameStore(s => s.startGame);
  const resetGame = useGameStore(s => s.resetGame);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);
  const setDirection = useGameStore(s => s.setDirection);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          setDirection([0, -1]);
          break;
        case 'ArrowDown':
        case 's':
          setDirection([0, 1]);
          break;
        case 'ArrowLeft':
        case 'a':
          setDirection([-1, 0]);
          break;
        case 'ArrowRight':
        case 'd':
          setDirection([1, 0]);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDirection]);
  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none">
      <Game3D />
      {/* HUD */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl px-6 py-3 border-4 border-blue-400 shadow-lg flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <span className="text-2xl font-black text-blue-900 tabular-nums">{score}</span>
        </div>
      </div>
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-xl border-4 border-blue-400 bg-white/80 h-12 w-12"
          onClick={() => status === 'RUNNING' ? pauseGame() : resumeGame()}
        >
          {status === 'PAUSED' ? <Play className="fill-blue-500 text-blue-500" /> : <Pause className="fill-blue-500 text-blue-500" />}
        </Button>
      </div>
      <MobileControls />
      {/* Overlays */}
      <AnimatePresence>
        {status === 'IDLE' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-blue-400/20 backdrop-blur-sm z-20"
          >
            <Card className="p-10 text-center border-8 border-white bg-blue-500 rounded-[3rem] shadow-2xl space-y-6">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-3xl rotate-3 shadow-xl">
                  <Sparkles className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              <h1 className="text-6xl font-black text-white drop-shadow-lg">SNAKEY 3D</h1>
              <p className="text-blue-100 font-bold text-lg">Eat fruits and grow big!</p>
              <Button 
                onClick={startGame}
                className="bg-orange-400 hover:bg-orange-500 text-white font-black text-2xl px-12 py-8 rounded-full border-b-8 border-orange-600 active:translate-y-1 active:border-b-4 transition-all"
              >
                LET'S PLAY!
              </Button>
            </Card>
          </motion.div>
        )}
        {status === 'GAMEOVER' && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-red-400/20 backdrop-blur-sm z-20"
          >
            <Card className="p-10 text-center border-8 border-white bg-red-500 rounded-[3rem] shadow-2xl space-y-6">
              <h2 className="text-5xl font-black text-white drop-shadow-lg">GAME OVER!</h2>
              <div className="bg-white/20 p-6 rounded-2xl">
                <p className="text-red-100 font-bold">Final Score</p>
                <p className="text-6xl font-black text-white tabular-nums">{score}</p>
              </div>
              <Button 
                onClick={resetGame}
                className="bg-blue-400 hover:bg-blue-500 text-white font-black text-2xl px-12 py-8 rounded-full border-b-8 border-blue-600 active:translate-y-1 active:border-b-4 transition-all flex items-center gap-3"
              >
                <RotateCcw className="w-8 h-8" />
                TRY AGAIN
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}