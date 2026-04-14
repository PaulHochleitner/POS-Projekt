import { describe, it, expect } from 'vitest';
import { interpolateFrame } from '../components/pitch/interpolation';
import type { Frame } from '../types';

describe('interpolation', () => {
  const frameA: Frame = {
    index: 0,
    label: 'Start',
    players: [
      { playerId: 1, playerName: 'GK', playerNumber: 1, position: 'GK', x: 50, y: 90, imageUrl: null },
      { playerId: 2, playerName: 'ST', playerNumber: 9, position: 'ST', x: 50, y: 20, imageUrl: null },
    ],
    opponents: [],
    ball: { x: 50, y: 50, carriedByPlayerId: null },
  };

  const frameB: Frame = {
    index: 1,
    label: 'End',
    players: [
      { playerId: 1, playerName: 'GK', playerNumber: 1, position: 'GK', x: 50, y: 90, imageUrl: null },
      { playerId: 2, playerName: 'ST', playerNumber: 9, position: 'ST', x: 80, y: 10, imageUrl: null },
    ],
    opponents: [],
    ball: { x: 80, y: 30, carriedByPlayerId: 2 },
  };

  it('should return start frame at t=0', () => {
    const result = interpolateFrame(frameA, frameB, 0);
    expect(result.players[0].x).toBe(50);
    expect(result.players[1].x).toBe(50);
    expect(result.players[1].y).toBe(20);
    expect(result.ball.x).toBe(50);
  });

  it('should return end frame at t=1', () => {
    const result = interpolateFrame(frameA, frameB, 1);
    expect(result.players[1].x).toBe(80);
    expect(result.players[1].y).toBe(10);
    expect(result.ball.x).toBe(80);
  });

  it('should interpolate at t=0.5', () => {
    const result = interpolateFrame(frameA, frameB, 0.5);
    expect(result.players[1].x).toBe(65);
    expect(result.players[1].y).toBe(15);
    expect(result.ball.x).toBe(65);
    expect(result.ball.y).toBe(40);
  });

  it('should use from label at t<0.5', () => {
    const result = interpolateFrame(frameA, frameB, 0.3);
    expect(result.label).toBe('Start');
  });

  it('should use to label at t>=0.5', () => {
    const result = interpolateFrame(frameA, frameB, 0.7);
    expect(result.label).toBe('End');
  });

  it('should handle ball carrier at t<0.5', () => {
    const result = interpolateFrame(frameA, frameB, 0.3);
    expect(result.ball.carriedByPlayerId).toBeNull();
  });

  it('should handle ball carrier at t>=0.5', () => {
    const result = interpolateFrame(frameA, frameB, 0.7);
    expect(result.ball.carriedByPlayerId).toBe(2);
  });
});
