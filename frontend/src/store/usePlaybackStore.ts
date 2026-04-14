import { create } from 'zustand';

interface PlaybackState {
  isPlaying: boolean;
  speed: number;
  currentTime: number;
  isLooping: boolean;

  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  setCurrentTime: (time: number) => void;
  toggleLoop: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  isPlaying: false,
  speed: 1,
  currentTime: 0,
  isLooping: false,

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentTime: 0 }),
  setSpeed: (speed) => set({ speed }),
  setCurrentTime: (time) => set({ currentTime: time }),
  toggleLoop: () => set((s) => ({ isLooping: !s.isLooping })),
}));
