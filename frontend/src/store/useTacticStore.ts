import { create } from 'zustand';
import type { Frame, PlayerPosition, BallPosition, FrameData, Player, Team, TeamSide } from '../types';

// Horizontal pitch: goals on left/right. Home defends LEFT, attacks RIGHT.
const DEFAULT_HOME_FORMATION: PlayerPosition[] = [
  { playerId: 1,  playerName: '', playerNumber: 1,  position: 'GK', x: 6,  y: 50, imageUrl: null },
  { playerId: 2,  playerName: '', playerNumber: 2,  position: 'RB', x: 18, y: 18, imageUrl: null },
  { playerId: 3,  playerName: '', playerNumber: 4,  position: 'CB', x: 16, y: 38, imageUrl: null },
  { playerId: 4,  playerName: '', playerNumber: 5,  position: 'CB', x: 16, y: 62, imageUrl: null },
  { playerId: 5,  playerName: '', playerNumber: 3,  position: 'LB', x: 18, y: 82, imageUrl: null },
  { playerId: 6,  playerName: '', playerNumber: 6,  position: 'CDM', x: 28, y: 50, imageUrl: null },
  { playerId: 7,  playerName: '', playerNumber: 8,  position: 'CM', x: 34, y: 28, imageUrl: null },
  { playerId: 8,  playerName: '', playerNumber: 10, position: 'CM', x: 34, y: 72, imageUrl: null },
  { playerId: 9,  playerName: '', playerNumber: 7,  position: 'RW', x: 44, y: 18, imageUrl: null },
  { playerId: 10, playerName: '', playerNumber: 9,  position: 'ST', x: 46, y: 50, imageUrl: null },
  { playerId: 11, playerName: '', playerNumber: 11, position: 'LW', x: 44, y: 82, imageUrl: null },
];

// Away mirrors: defends RIGHT, attacks LEFT. IDs 101–111 to avoid collision.
const DEFAULT_AWAY_FORMATION: PlayerPosition[] = [
  { playerId: 101, playerName: '', playerNumber: 1,  position: 'GK', x: 94, y: 50, imageUrl: null },
  { playerId: 102, playerName: '', playerNumber: 2,  position: 'RB', x: 82, y: 82, imageUrl: null },
  { playerId: 103, playerName: '', playerNumber: 4,  position: 'CB', x: 84, y: 62, imageUrl: null },
  { playerId: 104, playerName: '', playerNumber: 5,  position: 'CB', x: 84, y: 38, imageUrl: null },
  { playerId: 105, playerName: '', playerNumber: 3,  position: 'LB', x: 82, y: 18, imageUrl: null },
  { playerId: 106, playerName: '', playerNumber: 6,  position: 'CDM', x: 72, y: 50, imageUrl: null },
  { playerId: 107, playerName: '', playerNumber: 8,  position: 'CM', x: 66, y: 72, imageUrl: null },
  { playerId: 108, playerName: '', playerNumber: 10, position: 'CM', x: 66, y: 28, imageUrl: null },
  { playerId: 109, playerName: '', playerNumber: 7,  position: 'RW', x: 56, y: 82, imageUrl: null },
  { playerId: 110, playerName: '', playerNumber: 9,  position: 'ST', x: 54, y: 50, imageUrl: null },
  { playerId: 111, playerName: '', playerNumber: 11, position: 'LW', x: 56, y: 18, imageUrl: null },
];

const DEFAULT_BALL: BallPosition = { x: 50, y: 50, carriedByPlayerId: null };

function makeInitialFrame(): Frame {
  return {
    index: 0,
    label: 'Startposition',
    players: DEFAULT_HOME_FORMATION.map(p => ({ ...p })),
    opponents: DEFAULT_AWAY_FORMATION.map(p => ({ ...p })),
    ball: { ...DEFAULT_BALL },
  };
}

interface TacticState {
  tacticId: number | null;
  name: string;
  description: string;
  teamId: number | null;
  opponentTeamId: number | null;
  homeColor: string;
  awayColor: string;
  isPublic: boolean;
  tags: string[];
  uuid: string | null;
  frames: Frame[];
  currentFrameIndex: number;
  selectedPlayerId: number | null;
  selectedTeam: TeamSide | null;
  selectedBall: boolean;
  isDirty: boolean;

  setTacticMeta: (meta: { tacticId?: number | null; name?: string; description?: string; teamId?: number | null; opponentTeamId?: number | null; isPublic?: boolean; tags?: string[]; uuid?: string | null }) => void;
  loadFrames: (data: FrameData) => void;
  setCurrentFrame: (index: number) => void;
  addFrame: (label?: string) => void;
  removeFrame: (index: number) => void;
  updatePlayerPosition: (team: TeamSide, playerId: number, x: number, y: number) => void;
  updateBallPosition: (x: number, y: number) => void;
  selectPlayer: (id: number | null, team?: TeamSide | null) => void;
  selectBall: (selected: boolean) => void;
  setHomeTeam: (team: Team) => void;
  setAwayTeam: (team: Team) => void;
  getCurrentFrame: () => Frame;
  getFrameData: () => FrameData;
  reset: () => void;
}

function applyRoster(slots: PlayerPosition[], roster: Player[], idOffset: number): PlayerPosition[] {
  return slots.map((slot, i) => {
    const p = roster[i];
    if (!p) {
      return { ...slot, playerName: '', imageUrl: null };
    }
    return {
      ...slot,
      playerId: idOffset + p.id,
      playerName: p.name,
      playerNumber: p.number,
      position: p.position,
      imageUrl: p.imageUrl,
    };
  });
}

export const useTacticStore = create<TacticState>((set, get) => ({
  tacticId: null,
  name: 'Neue Taktik',
  description: '',
  teamId: null,
  opponentTeamId: null,
  homeColor: '#1e3a5f',
  awayColor: '#dc2626',
  isPublic: false,
  tags: [],
  uuid: null,
  frames: [makeInitialFrame()],
  currentFrameIndex: 0,
  selectedPlayerId: null,
  selectedTeam: null,
  selectedBall: false,
  isDirty: false,

  setTacticMeta: (meta) => set((s) => ({ ...s, ...meta, isDirty: true })),

  loadFrames: (data) => set(() => {
    const normalized: Frame[] = data.frames.map((f, i) => ({
      index: i,
      label: f.label ?? `Frame ${i + 1}`,
      players: (f.players ?? []).map(p => ({ imageUrl: null, ...p })),
      opponents: (f.opponents ?? DEFAULT_AWAY_FORMATION).map(p => ({ imageUrl: null, ...p })),
      ball: f.ball ?? { ...DEFAULT_BALL },
    }));
    return { frames: normalized.length > 0 ? normalized : [makeInitialFrame()], currentFrameIndex: 0, isDirty: false };
  }),

  setCurrentFrame: (index) => set({ currentFrameIndex: index, selectedPlayerId: null, selectedTeam: null, selectedBall: false }),

  addFrame: (label) => set((s) => {
    const current = s.frames[s.currentFrameIndex];
    const newFrame: Frame = {
      index: s.frames.length,
      label: label ?? `Frame ${s.frames.length + 1}`,
      players: current.players.map(p => ({ ...p })),
      opponents: current.opponents.map(p => ({ ...p })),
      ball: { ...current.ball },
    };
    return { frames: [...s.frames, newFrame], currentFrameIndex: s.frames.length, isDirty: true };
  }),

  removeFrame: (index) => set((s) => {
    if (s.frames.length <= 1) return s;
    const newFrames = s.frames.filter((_, i) => i !== index)
      .map((f, i) => ({ ...f, index: i }));
    return {
      frames: newFrames,
      currentFrameIndex: Math.min(s.currentFrameIndex, newFrames.length - 1),
      isDirty: true,
    };
  }),

  updatePlayerPosition: (team, playerId, x, y) => set((s) => {
    const newFrames = [...s.frames];
    const frame = { ...newFrames[s.currentFrameIndex] };
    const cx = Math.max(0, Math.min(100, x));
    const cy = Math.max(0, Math.min(100, y));
    if (team === 'home') {
      frame.players = frame.players.map(p => p.playerId === playerId ? { ...p, x: cx, y: cy } : p);
    } else {
      frame.opponents = frame.opponents.map(p => p.playerId === playerId ? { ...p, x: cx, y: cy } : p);
    }
    newFrames[s.currentFrameIndex] = frame;
    return { frames: newFrames, isDirty: true };
  }),

  updateBallPosition: (x, y) => set((s) => {
    const newFrames = [...s.frames];
    const frame = { ...newFrames[s.currentFrameIndex] };
    frame.ball = { ...frame.ball, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    newFrames[s.currentFrameIndex] = frame;
    return { frames: newFrames, isDirty: true };
  }),

  selectPlayer: (id, team = null) => set({ selectedPlayerId: id, selectedTeam: id === null ? null : team, selectedBall: false }),
  selectBall: (selected) => set({ selectedBall: selected, selectedPlayerId: null, selectedTeam: null }),

  setHomeTeam: (team) => set((s) => {
    const roster = team.players ?? [];
    const newFrames = s.frames.map(f => ({
      ...f,
      players: applyRoster(f.players.length === 11 ? f.players : DEFAULT_HOME_FORMATION.map(p => ({ ...p })), roster, 0),
    }));
    return {
      frames: newFrames,
      teamId: team.id,
      homeColor: team.primaryColor || '#1e3a5f',
      isDirty: true,
    };
  }),

  setAwayTeam: (team) => set((s) => {
    const roster = team.players ?? [];
    const newFrames = s.frames.map(f => ({
      ...f,
      opponents: applyRoster(f.opponents.length === 11 ? f.opponents : DEFAULT_AWAY_FORMATION.map(p => ({ ...p })), roster, 100000),
    }));
    return {
      frames: newFrames,
      opponentTeamId: team.id,
      awayColor: team.primaryColor || '#dc2626',
      isDirty: true,
    };
  }),

  getCurrentFrame: () => {
    const s = get();
    return s.frames[s.currentFrameIndex];
  },

  getFrameData: () => {
    const s = get();
    return { frames: s.frames, animationSpeed: 1.0, pitchType: 'full' };
  },

  reset: () => set({
    tacticId: null, name: 'Neue Taktik', description: '', teamId: null, opponentTeamId: null,
    homeColor: '#1e3a5f', awayColor: '#dc2626',
    isPublic: false, tags: [], uuid: null,
    frames: [makeInitialFrame()],
    currentFrameIndex: 0, selectedPlayerId: null, selectedTeam: null, selectedBall: false, isDirty: false,
  }),
}));
