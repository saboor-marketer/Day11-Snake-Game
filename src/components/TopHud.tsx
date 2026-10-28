import React from 'react';
import { Volume2, VolumeX, Pause, Play, Trophy, Gamepad2, Zap } from 'lucide-react';
import { GameState } from '../types/game';

interface TopHudProps {
  score: number;
  highScore: number;
  combo: number;
  comboProgress: number; // 0 to 1
  scorePop: boolean;
  gameState: GameState;
  muted: boolean;
  showDpad: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onToggleDpad: () => void;
}

export const TopHud: React.FC<TopHudProps> = ({
  score,
  highScore,
  combo,
  comboProgress,
  scorePop,
  gameState,
  muted,
  showDpad,
  onToggleMute,
  onTogglePause,
  onToggleDpad,
}) => {
  const isBeatingHigh = score > 0 && score >= highScore;

  return (
    <header
      className="w-full h-14 px-3 sm:px-4 rounded-xl bg-[#141B26]/90 backdrop-blur-md border border-sky-400/20 flex items-center justify-between gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.45)] shrink-0"
      aria-label="Game Telemetry HUD"
    >
      {/* Left Cluster: Current Score + Active Combo Badge */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 leading-none mb-1">
            SCORE
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-mono font-bold text-xl sm:text-2xl tracking-tight leading-none transition-transform duration-150 ${
                scorePop
                  ? 'scale-115 text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.65)]'
                  : 'scale-100 text-slate-50'
              }`}
            >
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Combo Multiplier Pill */}
        <div
          className={`relative overflow-hidden px-2 py-1 rounded-md border transition-all duration-200 flex items-center gap-1 ${
            combo > 1
              ? combo >= 4
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.28)] scale-105'
                : 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
              : 'bg-slate-800/50 border-slate-700/50 text-slate-500 opacity-75'
          }`}
          title="Active Chain Multiplier"
        >
          <Zap
            className={`w-3 h-3 ${
              combo >= 4
                ? 'text-amber-400 fill-amber-400 animate-pulse'
                : combo > 1
                ? 'text-emerald-400 fill-emerald-400'
                : 'text-slate-500'
            }`}
          />
          <span className="font-mono font-bold text-xs tracking-wider">
            {combo}x
          </span>

          {/* Combo decay timer bar at bottom of pill */}
          {combo > 1 && comboProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-900/70">
              <div
                className={`h-full transition-none ${
                  combo >= 4 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, comboProgress * 100))}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Center Cluster: All-Time High Score */}
      <div className="flex flex-col items-center px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 leading-none mb-1">
          <Trophy
            className={`w-3 h-3 ${
              isBeatingHigh ? 'text-amber-400 animate-bounce' : 'text-amber-400/80'
            }`}
          />
          <span>HIGH SCORE</span>
        </div>
        <span
          className={`font-mono font-bold text-sm sm:text-base leading-none ${
            isBeatingHigh
              ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
              : 'text-slate-200'
          }`}
        >
          {Math.max(score, highScore).toLocaleString()}
        </span>
      </div>

      {/* Right Cluster: Controls (D-Pad toggle, Mute, Pause) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleDpad}
          className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
            showDpad
              ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
          title="Toggle On-Screen Touch D-Pad"
          aria-label="Toggle On-Screen Touch D-Pad"
        >
          <Gamepad2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
            !muted
              ? 'bg-slate-800/60 border-slate-700/60 text-emerald-400 hover:border-emerald-500/40'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
          }`}
          title={muted ? 'Unmute Synth Audio [M]' : 'Mute Synth Audio [M]'}
          aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onTogglePause}
          disabled={gameState === 'START' || gameState === 'GAME_OVER'}
          className={`px-2.5 py-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase ${
            gameState === 'START' || gameState === 'GAME_OVER'
              ? 'bg-slate-900/40 border-slate-800/50 text-slate-600 cursor-not-allowed'
              : gameState === 'PAUSED'
              ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 cursor-pointer hover:bg-amber-500/30'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-200 cursor-pointer hover:border-sky-400/50 hover:text-sky-300'
          }`}
          title="Pause / Resume Game [P or ESC]"
          aria-label={gameState === 'PAUSED' ? 'Resume Game' : 'Pause Game'}
        >
          {gameState === 'PAUSED' ? (
            <Play className="w-4 h-4 fill-current" />
          ) : (
            <Pause className="w-4 h-4" />
          )}
          <span className="hidden sm:inline font-mono text-[11px]">
            {gameState === 'PAUSED' ? 'RESUME' : 'PAUSE'}
          </span>
        </button>
      </div>
    </header>
  );
};
