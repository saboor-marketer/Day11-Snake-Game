import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Direction } from '../types/game';

interface TouchDpadProps {
  currentDirection: Direction;
  onDirectionInput: (dir: Direction) => void;
  disabled?: boolean;
}

export const TouchDpad: React.FC<TouchDpadProps> = ({
  currentDirection,
  onDirectionInput,
  disabled = false,
}) => {
  const handleTrigger = (dir: Direction, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {
        // Ignore on unsupported browsers
      }
    }
    onDirectionInput(dir);
  };

  const getBtnClass = (dir: Direction) => {
    const isActive = currentDirection === dir && !disabled;
    return `relative select-none touch-none flex items-center justify-center rounded-xl border transition-all duration-75 active:scale-92 ${
      disabled
        ? 'bg-slate-900/40 border-slate-800/50 text-slate-600 cursor-not-allowed'
        : isActive
        ? 'bg-emerald-500/25 border-emerald-400/70 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
        : 'bg-[#141B26]/90 border-sky-400/25 text-slate-200 hover:border-sky-400/50 active:bg-emerald-500/30 active:border-emerald-400'
    }`;
  };

  return (
    <div
      className="w-full max-w-[420px] flex items-center justify-between gap-3 px-2 py-1 shrink-0 select-none"
      aria-label="Touch Directional Controls"
    >
      {/* Left Cluster: Left / Right or Ergonomic Split / Cross D-Pad */}
      <div className="hidden xs:flex flex-col text-[10px] font-mono text-slate-500 uppercase tracking-wider leading-tight">
        <span className="text-sky-400/80 font-semibold">TOUCH ARENA</span>
        <span>SWIPE OR TAP PAD</span>
      </div>

      {/* Tactile 4-Way Arcade D-Pad Grid */}
      <div className="mx-auto grid grid-cols-3 grid-rows-2 gap-2 w-52 sm:w-60 h-24 sm:h-26">
        <div />
        <button
          type="button"
          onPointerDown={(e) => handleTrigger('UP', e)}
          className={getBtnClass('UP')}
          aria-label="Turn Up"
        >
          <ChevronUp className="w-6 h-6 stroke-[2.5]" />
        </button>
        <div />

        <button
          type="button"
          onPointerDown={(e) => handleTrigger('LEFT', e)}
          className={getBtnClass('LEFT')}
          aria-label="Turn Left"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => handleTrigger('DOWN', e)}
          className={getBtnClass('DOWN')}
          aria-label="Turn Down"
        >
          <ChevronDown className="w-6 h-6 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => handleTrigger('RIGHT', e)}
          className={getBtnClass('RIGHT')}
          aria-label="Turn Right"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <div className="hidden xs:flex flex-col items-end text-[10px] font-mono text-slate-500 uppercase tracking-wider leading-tight">
        <span className="text-emerald-400/80 font-semibold">2-STEP BUFFER</span>
        <span>ZERO-LAG TURNS</span>
      </div>
    </div>
  );
};
