import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaybackStore } from '../store/usePlaybackStore';

describe('usePlaybackStore', () => {
  beforeEach(() => {
    usePlaybackStore.getState().stop();
  });

  it('should start stopped', () => {
    expect(usePlaybackStore.getState().isPlaying).toBe(false);
    expect(usePlaybackStore.getState().currentTime).toBe(0);
  });

  it('should play', () => {
    usePlaybackStore.getState().play();
    expect(usePlaybackStore.getState().isPlaying).toBe(true);
  });

  it('should pause', () => {
    usePlaybackStore.getState().play();
    usePlaybackStore.getState().pause();
    expect(usePlaybackStore.getState().isPlaying).toBe(false);
  });

  it('should stop and reset time', () => {
    usePlaybackStore.getState().play();
    usePlaybackStore.getState().setCurrentTime(0.5);
    usePlaybackStore.getState().stop();
    expect(usePlaybackStore.getState().isPlaying).toBe(false);
    expect(usePlaybackStore.getState().currentTime).toBe(0);
  });

  it('should change speed', () => {
    usePlaybackStore.getState().setSpeed(2);
    expect(usePlaybackStore.getState().speed).toBe(2);
  });

  it('should toggle loop', () => {
    expect(usePlaybackStore.getState().isLooping).toBe(false);
    usePlaybackStore.getState().toggleLoop();
    expect(usePlaybackStore.getState().isLooping).toBe(true);
    usePlaybackStore.getState().toggleLoop();
    expect(usePlaybackStore.getState().isLooping).toBe(false);
  });

  it('should set current time', () => {
    usePlaybackStore.getState().setCurrentTime(0.75);
    expect(usePlaybackStore.getState().currentTime).toBe(0.75);
  });
});
