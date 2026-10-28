import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Trophy,
  Zap,
  ShieldAlert,
  Sparkles,
  Keyboard,
  Smartphone,
  Volume2,
  VolumeX,
  Activity,
  Trash2,
} from 'lucide-react';
import {
  ArenaMode,
  GameState,
  LeaderboardEntry,
  SessionStats,
  SpeedPreset,
} from '../types/game';
import { formatRelativeTime } from '../utils/storage';

interface StateOverlaysProps {
  gameState: GameState;
  arenaMode: ArenaMode;
  speedPreset: SpeedPreset;
  screenShake: boolean;
  muted: boolean;
  callsign: string;
  leaderboard: LeaderboardEntry[];
  sessionStats: SessionStats;
  lastRunRank: number | null;
  lastRunEntryId: string | null;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onQuitToTitle: () => void;
  onChangeArenaMode: (mode: ArenaMode) => void;
  onChangeSpeedPreset: (preset: SpeedPreset) => void;
  onToggleScreenShake: () => void;
  onToggleMute: () => void;
  onUpdateCallsign: (callsign: string) => void;
  onResetLeaderboard: () => void;
}

export const StateOverlays: React.FC<StateOverlaysProps> = ({
  gameState,
  arenaMode,
  speedPreset,
  screenShake,
  muted,
  callsign,
  leaderboard,
  sessionStats,
  lastRunRank,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onQuitToTitle,
  onChangeArenaMode,
  onChangeSpeedPreset,
  onToggleScreenShake,
  onToggleMute,
  onUpdateCallsign,
  onResetLeaderboard,
}) => {
  const [showStartLeaderboard, setShowStartLeaderboard] = useState(false);

  if (gameState === 'PLAYING') return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5 bg-[#0A0D12]/65 backdrop-blur-[6px] transition-opacity duration-150">
      {/* ================= START SCREEN OVERLAY ================= */}
      {gameState === 'START' && (
        <div className="w-full max-w-[440px] rounded-2xl bg-[#141B26]/92 border border-sky-400/30 p-4 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.75),0_0_32px_rgba(16,185,129,0.12)] flex flex-col items-center text-center">
          {/* Custom SVG Cyber-Viper Vector Emblem + Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono uppercase tracking-widest mb-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>PHOSPHOR ARCADE REVIVAL // 60FPS</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-1">
            {/* Custom Precision Vector Snake Icon */}
            <svg
              className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="26"
                width="8"
                height="8"
                rx="2.5"
                className="fill-emerald-700/80"
              />
              <rect
                x="13"
                y="26"
                width="8"
                height="8"
                rx="2.5"
                className="fill-emerald-600"
              />
              <rect
                x="13"
                y="17"
                width="8"
                height="8"
                rx="2.5"
                className="fill-emerald-500"
              />
              <rect
                x="13"
                y="8"
                width="8"
                height="8"
                rx="2.5"
                className="fill-emerald-400"
              />
              <rect
                x="22"
                y="8"
                width="10"
                height="9"
                rx="3"
                className="fill-emerald-300"
              />
              <circle cx="29" cy="10.8" r="1.3" className="fill-slate-950" />
              <circle cx="29" cy="14.2" r="1.3" className="fill-slate-950" />
              <path
                d="M32 12.5H36.5M36.5 12.5L38.5 10.5M36.5 12.5L38.5 14.5"
                stroke="#F43F5E"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-wider uppercase text-slate-50 drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]">
              VIPER <span className="text-emerald-400">//</span> 84
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-[340px] mb-4 leading-relaxed">
            Harvest <span className="text-rose-400 font-semibold">Hyper Cores</span> & chain rapid pickups to ignite{' '}
            <span className="text-amber-300 font-semibold">Solar Overdrive</span> multipliers.
          </p>

          {!showStartLeaderboard ? (
            <>
              {/* Mode & Speed Configuration Row */}
              <div className="w-full grid grid-cols-2 gap-2 mb-4">
                <div className="flex flex-col bg-slate-900/75 border border-slate-800 rounded-xl p-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    ARENA BOUNDARY
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => onChangeArenaMode('WALLS')}
                      className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                        arenaMode === 'WALLS'
                          ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      WALLS
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeArenaMode('WRAP')}
                      className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                        arenaMode === 'WRAP'
                          ? 'bg-sky-500/20 border border-sky-400/60 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                          : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      PHASE
                    </button>
                  </div>
                </div>

                <div className="flex flex-col bg-slate-900/75 border border-slate-800 rounded-xl p-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    DRIVE VELOCITY
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => onChangeSpeedPreset('ARCADE')}
                      className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                        speedPreset === 'ARCADE'
                          ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      ARCADE
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeSpeedPreset('TURBO')}
                      className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                        speedPreset === 'TURBO'
                          ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      TURBO
                    </button>
                  </div>
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                type="button"
                onClick={onStartGame}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-98 text-slate-950 font-display font-bold text-lg tracking-wider uppercase shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all flex items-center justify-center gap-2.5 cursor-pointer mb-3"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>START GAME</span>
                <span className="ml-1 px-2 py-0.5 rounded bg-slate-950/20 font-mono text-xs font-bold">
                  [SPACE]
                </span>
              </button>

              {/* Secondary Leaderboard Toggle */}
              <button
                type="button"
                onClick={() => setShowStartLeaderboard(true)}
                className="w-full py-2 px-4 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mb-4"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>VIEW TOP 5 HIGH SCORES</span>
              </button>

              {/* Control Hints Footer */}
              <div className="w-full pt-3 border-t border-slate-800/90 grid grid-cols-2 gap-2 text-left">
                <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-2.5 py-1.5 border border-slate-800/60">
                  <Keyboard className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      DESKTOP
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200">
                      WASD / ARROWS
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-2.5 py-1.5 border border-slate-800/60">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      TOUCH
                    </span>
                    <span className="text-[11px] font-semibold text-slate-200">
                      SWIPE / D-PAD
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Start Screen Top 5 Leaderboard Subview */
            <div className="w-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-semibold">
                  <Trophy className="w-3.5 h-3.5" />
                  LOCAL HALL OF FAME
                </span>
                <button
                  type="button"
                  onClick={onResetLeaderboard}
                  className="text-[11px] font-mono text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Reset Scores to Default"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              </div>

              <div className="w-full rounded-xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/70 mb-3 overflow-hidden">
                {leaderboard.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 text-left font-bold ${
                          idx === 0
                            ? 'text-amber-400'
                            : idx === 1
                            ? 'text-slate-300'
                            : idx === 2
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-100 tracking-wider bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.callsign}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.maxCombo}x • {item.mode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {item.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowStartLeaderboard(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all"
                >
                  BACK
                </button>
                <button
                  type="button"
                  onClick={onStartGame}
                  className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>LAUNCH</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= PAUSE OVERLAY ================= */}
      {gameState === 'PAUSED' && (
        <div className="w-full max-w-[380px] rounded-2xl bg-[#141B26]/95 border border-amber-400/35 p-5 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
          <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 font-mono text-xs uppercase tracking-widest mb-2">
            SYSTEM STANDBY
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-slate-50 mb-4">
            GAME PAUSED
          </h2>

          {/* Current Run Telemetry */}
          <div className="w-full grid grid-cols-3 gap-2 mb-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                SCORE
              </span>
              <span className="font-mono font-bold text-base text-emerald-400">
                {sessionStats.score.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col border-x border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                PEAK COMBO
              </span>
              <span className="font-mono font-bold text-base text-amber-400">
                {sessionStats.maxCombo}x
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                LENGTH
              </span>
              <span className="font-mono font-bold text-base text-sky-400">
                {sessionStats.length}
              </span>
            </div>
          </div>

          {/* Quick Settings Toggles */}
          <div className="w-full grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={onToggleScreenShake}
              className={`py-2 px-3 rounded-xl border font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                screenShake
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>SHAKE: {screenShake ? 'ON' : 'OFF'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className={`py-2 px-3 rounded-xl border font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                !muted
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>AUDIO: {muted ? 'OFF' : 'ON'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onResumeGame}
            className="w-full py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer mb-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME MISSION [P]</span>
          </button>

          <div className="w-full grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRestartGame}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESTART</span>
            </button>
            <button
              type="button"
              onClick={onQuitToTitle}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 font-mono text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      {/* ================= GAME OVER & HIGH-SCORE OVERLAY ================= */}
      {gameState === 'GAME_OVER' && (
        <div className="w-full max-w-[440px] rounded-2xl bg-[#141B26]/95 border border-rose-500/35 p-4 sm:p-5 shadow-[0_16px_56px_rgba(0,0,0,0.85),0_0_32px_rgba(239,68,68,0.14)] flex flex-col items-center text-center">
          {/* Header Badge */}
          <div className="flex items-center gap-2 mb-1">
            {lastRunRank === 1 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 font-mono text-[11px] font-bold uppercase tracking-widest animate-bounce">
                <Sparkles className="w-3.5 h-3.5" />
                NEW ALL-TIME RECORD!
              </span>
            ) : lastRunRank !== null ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono text-[11px] font-bold uppercase tracking-widest">
                <Trophy className="w-3 h-3" />
                TOP 5 LEADERBOARD (#{lastRunRank})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 font-mono text-[10px] uppercase tracking-widest">
                <ShieldAlert className="w-3 h-3" />
                {sessionStats.causeOfDeath === 'WALL'
                  ? 'PERIMETER WALL IMPACT'
                  : 'SELF-INTERSECTION FAULT'}
              </span>
            )}
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-slate-50 mb-2">
            SIGNAL TERMINATED
          </h2>

          {/* Run Summary Stats Strip */}
          <div className="w-full grid grid-cols-4 gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 mb-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-slate-400 uppercase">
                FINAL SCORE
              </span>
              <span className="font-mono font-bold text-base sm:text-lg text-emerald-400">
                {sessionStats.score.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col border-l border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">
                PEAK COMBO
              </span>
              <span className="font-mono font-bold text-base sm:text-lg text-amber-400">
                {sessionStats.maxCombo}x
              </span>
            </div>
            <div className="flex flex-col border-l border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">
                LENGTH
              </span>
              <span className="font-mono font-bold text-base sm:text-lg text-sky-400">
                {sessionStats.length}
              </span>
            </div>
            <div className="flex flex-col border-l border-slate-800">
              <span className="text-[9px] font-mono text-slate-400 uppercase">
                TIME
              </span>
              <span className="font-mono font-bold text-base sm:text-lg text-slate-200">
                {Math.max(1, Math.round(sessionStats.survivalTimeMs / 1000))}s
              </span>
            </div>
          </div>

          {/* Callsign Quick-Edit Row when player makes the Top 5 */}
          {lastRunRank !== null && (
            <div className="w-full flex items-center justify-between gap-2 bg-amber-500/10 border border-amber-400/35 rounded-xl px-3 py-1.5 mb-3">
              <span className="text-[11px] font-mono text-amber-200 uppercase tracking-wider">
                RECORD CALLSIGN:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={3}
                  value={callsign}
                  onChange={(e) => onUpdateCallsign(e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent Space/WASD inside input from triggering global shortcuts if typing, except Enter
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      onRestartGame();
                    }
                  }}
                  className="w-16 px-2 py-0.5 rounded bg-slate-950 border border-amber-400/60 font-mono font-bold text-sm text-center text-amber-300 uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-400"
                  aria-label="3-Letter Callsign"
                />
                <span className="text-[10px] font-mono text-slate-400">
                  [SAVED]
                </span>
              </div>
            </div>
          )}

          {/* Top 5 Local High-Score Table */}
          <div className="w-full flex flex-col mb-3">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 px-1">
              <span className="flex items-center gap-1 text-slate-300 font-semibold">
                <Trophy className="w-3 h-3 text-amber-400" />
                TOP 5 LOCAL LEADERBOARD
              </span>
              <span>COMBO • SCORE</span>
            </div>

            <div className="w-full rounded-xl bg-slate-900/85 border border-slate-800/90 divide-y divide-slate-800/70 overflow-hidden">
              {leaderboard.map((item, idx) => {
                const isCurrentRun = Boolean(item.isNew);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono transition-colors ${
                      isCurrentRun
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 text-left font-bold ${
                          idx === 0
                            ? 'text-amber-400'
                            : idx === 1
                            ? 'text-slate-200'
                            : idx === 2
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span
                        className={`font-bold tracking-wider px-1.5 py-0.2 rounded text-[11px] ${
                          isCurrentRun
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {item.callsign}
                      </span>
                      {isCurrentRun && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[9px] font-bold uppercase">
                          NEW
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-amber-400/90 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        {item.maxCombo}x
                      </span>
                      <span
                        className={`font-bold text-sm min-w-[54px] text-right ${
                          isCurrentRun ? 'text-emerald-300' : 'text-slate-100'
                        }`}
                      >
                        {item.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instant Restart Primary Button + Menu Button */}
          <div className="w-full flex gap-2">
            <button
              type="button"
              onClick={onQuitToTitle}
              className="py-3 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-mono text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all shrink-0"
              title="Return to Main Menu"
            >
              MENU
            </button>

            <button
              type="button"
              onClick={onRestartGame}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-98 text-slate-950 font-display font-bold text-base sm:text-lg tracking-wider uppercase shadow-[0_0_24px_rgba(16,185,129,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>PLAY AGAIN</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-950/20 font-mono text-[11px] font-bold">
                [SPACE]
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
