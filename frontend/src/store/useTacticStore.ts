import { create } from 'zustand';
import type { Frame, PlayerPosition, BallPosition, FrameData } from '../types';

const DEFAULT_FORMATION: PlayerPosition[] = [
  { playerId: 1, playerName: 'GK', playerNumber: 1, position: 'GK', x: 50, y: 92 },
  { playerId: 2, playerName: 'LB', playerNumber: 2, position: 'LB', x: 15, y: 75 },
  { playerId: 3, playerName: 'CB', playerNumber: 4, position: 'CB', x: 38, y: 78 },
  { playerId: 4, playerName: 'CB', playerNumber: 5, position: 'CB', x: 62, y: 78 },
  { playerId: 5, playerName: 'RB', playerNumber: 3, position: 'RB', x: 85, y: 75 },
  { playerId: 6, playerName: 'CM', playerNumber: 6, position: 'CM', x: 30, y: 55 },
  { playerId: 7, playerName: 'CDM', playerNumber: 8, position: 'CDM', x: 50, y: 60 },
  { playerId: 8, playerName: 'CM', playerNumber: 10, position: 'CM', x: 70, y: 55 },
  { playerId: 9, playerName: 'LW', playerNumber: 11, position: 'LW', x: 20, y: 30 },
  { playerId: 10, playerName: 'ST', playerNumber: 9, position: 'ST', x: 50, y: 20 },
  { playerId: 11, playerName: 'RW', playerNumber: 7, position: 'RW', x: 80, y: 30 },
];

const DEFAULT_BALL: BallPosition = { x: 50, y: 50, carriedByPlayerId: null };

interface TacticState {
  tacticId: number | null;
  name: string;
  description: string;
  teamId: number | null;
  isPublic: boolean;
  tags: string[];
  uuid: string | null;
  frames: Frame[];
  currentFrameIndex: number;
  selectedPlayerId: number | null;
  selectedBall: boolean;
  isDirty: boolean;

  setTacticMeta: (meta: { tacticId?: number | null; name?: string; description?: string; teamId?: number | null; isPublic?: boolean; tags?: string[]; uuid?: string | null }) => void;
  loadFrames: (data: FrameData) => void;
  setCurrentFrame: (index: number) => void;
  addFrame: (label?: string) => void;
  removeFrame: (index: number) => void;
  updatePlayerPosition: (playerId: number, x: number, y: number) => void;
  updateBallPosition: (x: number, y: number) => void;
  selectPlayer: (id: number | null) => void;
  selectBall: (selected: boolean) => void;
  getCurrentFrame: () => Frame;
  getFrameData: () => FrameData;
  reset: () => void;
}

export const useTacticStore = create<TacticState>((set, get) => ({
  tacticId: null,
  name: 'Neue Taktik',
  description: '',
  teamId: null,
  isPublic: false,
  tags: [],
  uuid: null,
  frames: [{ index: 0, label: 'Startposition', players: [...DEFAULT_FORMATION], ball: { ...DEFAULT_BALL } }],
  currentFrameIndex: 0,
  selectedPlayerId: null,
  selectedBall: false,
  isDirty: false,

  setTacticMeta: (meta) => set((s) => ({ ...s, ...meta, isDirty: true })),

  loadFrames: (data) => set({ frames: data.frames, currentFrameIndex: 0, isDirty: false }),

  setCurrentFrame: (index) => set({ currentFrameIndex: index, selectedPlayerId: null, selectedBall: false }),

  addFrame: (label) => set((s) => {
    const current = s.frames[s.currentFrameIndex];
    const newFrame: Frame = {
      index: s.frames.length,
      label: label ?? `Frame ${s.frames.length + 1}`,
      players: current.players.map(p => ({ ...p })),
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

  updatePlayerPosition: (playerId, x, y) => set((s) => {
    const newFrames = [...s.frames];
    const frame = { ...newFrames[s.currentFrameIndex] };
    frame.players = frame.players.map(p =>
      p.playerId === playerId ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : p
    );
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

  selectPlayer: (id) => set({ selectedPlayerId: id, selectedBall: false }),
  selectBall: (selected) => set({ selectedBall: selected, selectedPlayerId: null }),

  getCurrentFrame: () => {
    const s = get();
    return s.frames[s.currentFrameIndex];
  },

  getFrameData: () => {
    const s = get();
    return { frames: s.frames, animationSpeed: 1.0, pitchType: 'full' };
  },

  reset: () => set({
    tacticId: null, name: 'Neue Taktik', description: '', teamId: null,
    isPublic: false, tags: [], uuid: null,
    frames: [{ index: 0, label: 'Startposition', players: [...DEFAULT_FORMATION], ball: { ...DEFAULT_BALL } }],
    currentFrameIndex: 0, selectedPlayerId: null, selectedBall: false, isDirty: false,
  }),
}));
