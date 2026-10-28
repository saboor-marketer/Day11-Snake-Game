import { ArenaMode, LeaderboardEntry, SpeedPreset } from '../types/game';

const LEADERBOARD_KEY = 'viper84_leaderboard_v1';
const SETTINGS_KEY = 'viper84_settings_v1';

export interface StoredSettings {
  muted: boolean;
  screenShake: boolean;
  arenaMode: ArenaMode;
  speedPreset: SpeedPreset;
  callsign: string;
  forceShowDpad: boolean;
}

const DEFAULT_SETTINGS: StoredSettings = {
  muted: false,
  screenShake: true,
  arenaMode: 'WALLS',
  speedPreset: 'ARCADE',
  callsign: 'VPR',
  forceShowDpad: false,
};

const SEED_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    callsign: 'NXS',
    score: 2450,
    maxCombo: 6,
    length: 19,
    mode: 'WALLS',
    timestamp: Date.now() - 1000 * 60 * 60 * 14,
  },
  {
    id: 'seed-2',
    callsign: 'KAI',
    score: 1650,
    maxCombo: 5,
    length: 15,
    mode: 'WALLS',
    timestamp: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: 'seed-3',
    callsign: 'ZRO',
    score: 1100,
    maxCombo: 4,
    length: 12,
    mode: 'WALLS',
    timestamp: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'seed-4',
    callsign: 'VEX',
    score: 650,
    maxCombo: 3,
    length: 9,
    mode: 'WALLS',
    timestamp: Date.now() - 1000 * 60 * 95,
  },
  {
    id: 'seed-5',
    callsign: 'SYN',
    score: 300,
    maxCombo: 2,
    length: 6,
    mode: 'WALLS',
    timestamp: Date.now() - 1000 * 60 * 30,
  },
];

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(SEED_LEADERBOARD));
      return SEED_LEADERBOARD;
    }
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SEED_LEADERBOARD;
    }
    return parsed
      .map((item) => ({ ...item, isNew: false }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } catch {
    return SEED_LEADERBOARD;
  }
}

export function saveScoreToLeaderboard(entry: Omit<LeaderboardEntry, 'id' | 'timestamp' | 'isNew'>): {
  entries: LeaderboardEntry[];
  madeTopFive: boolean;
  rank: number | null;
  newEntryId: string;
} {
  const current = loadLeaderboard().map((e) => ({ ...e, isNew: false }));
  const newEntryId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const newEntry: LeaderboardEntry = {
    ...entry,
    callsign: (entry.callsign || 'VPR').toUpperCase().slice(0, 3),
    id: newEntryId,
    timestamp: Date.now(),
    isNew: true,
  };

  if (entry.score <= 0) {
    return {
      entries: current,
      madeTopFive: false,
      rank: null,
      newEntryId,
    };
  }

  const combined = [...current, newEntry].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.timestamp - a.timestamp;
  });

  const topFive = combined.slice(0, 5);
  const rankIdx = topFive.findIndex((item) => item.id === newEntryId);
  const madeTopFive = rankIdx !== -1;

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topFive));
  } catch {
    // Ignore storage quota issues
  }

  return {
    entries: topFive,
    madeTopFive,
    rank: madeTopFive ? rankIdx + 1 : null,
    newEntryId,
  };
}

export function updateEntryCallsign(entryId: string, newCallsign: string): LeaderboardEntry[] {
  const clean = (newCallsign || 'VPR').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'VPR';
  const current = loadLeaderboard();
  const updated = current.map((item) =>
    item.id === entryId ? { ...item, callsign: clean, isNew: true } : item
  );
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function resetLeaderboard(): LeaderboardEntry[] {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(SEED_LEADERBOARD));
  } catch {
    // Ignore
  }
  return SEED_LEADERBOARD;
}

export function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(partial: Partial<StoredSettings>): StoredSettings {
  const merged = { ...loadSettings(), ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    // Ignore
  }
  return merged;
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 45) return 'JUST NOW';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}M AGO`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}H AGO`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}D AGO`;
}
