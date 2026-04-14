import { describe, it, expect } from 'vitest';
import { hitTestPlayer, hitTestBall, canvasToPercent, getPositionColor } from '../components/pitch/pitchRenderer';
import type { PlayerPosition, BallPosition } from '../types';

describe('pitchRenderer', () => {
  const W = 800;
  const H = 520;

  describe('getPositionColor', () => {
    it('should return yellow for GK', () => {
      expect(getPositionColor('GK')).toBe('#EAB308');
    });

    it('should return blue for defenders', () => {
      expect(getPositionColor('CB')).toBe('#3B82F6');
      expect(getPositionColor('LB')).toBe('#3B82F6');
      expect(getPositionColor('RB')).toBe('#3B82F6');
    });

    it('should return green for midfielders', () => {
      expect(getPositionColor('CM')).toBe('#22C55E');
      expect(getPositionColor('CDM')).toBe('#22C55E');
      expect(getPositionColor('CAM')).toBe('#22C55E');
    });

    it('should return red for attackers', () => {
      expect(getPositionColor('ST')).toBe('#EF4444');
      expect(getPositionColor('LW')).toBe('#EF4444');
      expect(getPositionColor('RW')).toBe('#EF4444');
    });

    it('should return fallback for unknown', () => {
      expect(getPositionColor('XX')).toBe('#94a3b8');
    });
  });

  describe('canvasToPercent', () => {
    it('should convert canvas origin to 0,0', () => {
      const [x, y] = canvasToPercent(30, 30, W, H);
      expect(x).toBe(0);
      expect(y).toBe(0);
    });

    it('should convert canvas end to 100,100', () => {
      const [x, y] = canvasToPercent(W - 30, H - 30, W, H);
      expect(x).toBeCloseTo(100, 0);
      expect(y).toBeCloseTo(100, 0);
    });

    it('should convert center to ~50,50', () => {
      const [x, y] = canvasToPercent(W / 2, H / 2, W, H);
      expect(x).toBeCloseTo(50, 0);
      expect(y).toBeCloseTo(50, 0);
    });

    it('should clamp values to 0-100', () => {
      const [x, y] = canvasToPercent(0, 0, W, H);
      expect(x).toBe(0);
      expect(y).toBe(0);
    });
  });

  describe('hitTestPlayer', () => {
    const players: PlayerPosition[] = [
      { playerId: 1, playerName: 'GK', playerNumber: 1, position: 'GK', x: 50, y: 50, imageUrl: null },
    ];

    it('should detect hit on player', () => {
      // Player at 50%, 50% -> canvas center
      const cx = 30 + (50 / 100) * (W - 60);
      const cy = 30 + (50 / 100) * (H - 60);
      const hit = hitTestPlayer(cx, cy, W, H, players, []);
      expect(hit).not.toBeNull();
      expect(hit!.playerId).toBe(1);
      expect(hit!.team).toBe('home');
    });

    it('should return null for miss', () => {
      expect(hitTestPlayer(0, 0, W, H, players, [])).toBeNull();
    });
  });

  describe('hitTestBall', () => {
    const ball: BallPosition = { x: 50, y: 50, carriedByPlayerId: null };

    it('should detect hit on ball', () => {
      const bx = 30 + (50 / 100) * (W - 60);
      const by = 30 + (50 / 100) * (H - 60);
      expect(hitTestBall(bx, by, W, H, ball)).toBe(true);
    });

    it('should return false for miss', () => {
      expect(hitTestBall(0, 0, W, H, ball)).toBe(false);
    });
  });
});
