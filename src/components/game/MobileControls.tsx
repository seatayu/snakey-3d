import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
export function MobileControls() {
  const setDirection = useGameStore(s => s.setDirection);
  const status = useGameStore(s => s.status);
  if (status !== 'RUNNING') return null;
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 md:hidden grid grid-cols-3 gap-2">
      <div />
      <Button 
        variant="secondary" 
        className="h-16 w-16 rounded-2xl border-4 border-blue-400"
        onPointerDown={() => setDirection([0, -1])}
      >
        <ChevronUp className="w-8 h-8" />
      </Button>
      <div />
      <Button 
        variant="secondary" 
        className="h-16 w-16 rounded-2xl border-4 border-blue-400"
        onPointerDown={() => setDirection([-1, 0])}
      >
        <ChevronLeft className="w-8 h-8" />
      </Button>
      <Button 
        variant="secondary" 
        className="h-16 w-16 rounded-2xl border-4 border-blue-400"
        onPointerDown={() => setDirection([0, 1])}
      >
        <ChevronDown className="w-8 h-8" />
      </Button>
      <Button 
        variant="secondary" 
        className="h-16 w-16 rounded-2xl border-4 border-blue-400"
        onPointerDown={() => setDirection([1, 0])}
      >
        <ChevronRight className="w-8 h-8" />
      </Button>
    </div>
  );
}