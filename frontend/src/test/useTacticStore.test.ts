import { describe, it, expect, beforeEach } from 'vitest';
import { useTacticStore } from '../store/useTacticStore';

describe('useTacticStore', () => {
  beforeEach(() => {
    useTacticStore.getState().reset();
  });

  it('should have default state with 11 players', () => {
    const state = useTacticStore.getState();
    expect(state.frames).toHaveLength(1);
    expect(state.frames[0].players).toHaveLength(11);
    expect(state.name).toBe('Neue Taktik');
  });

  it('should add a frame', () => {
    useTacticStore.getState().addFrame('Test Frame');
    const state = useTacticStore.getState();
    expect(state.frames).toHaveLength(2);
    expect(state.frames[1].label).toBe('Test Frame');
    expect(state.currentFrameIndex).toBe(1);
  });

  it('should remove a frame', () => {
    useTacticStore.getState().addFrame('Frame 2');
    useTacticStore.getState().removeFrame(1);
    expect(useTacticStore.getState().frames).toHaveLength(1);
  });

  it('should not remove last frame', () => {
    useTacticStore.getState().removeFrame(0);
    expect(useTacticStore.getState().frames).toHaveLength(1);
  });

  it('should update player position', () => {
    useTacticStore.getState().updatePlayerPosition(1, 70, 80);
    const player = useTacticStore.getState().frames[0].players.find(p => p.playerId === 1);
    expect(player?.x).toBe(70);
    expect(player?.y).toBe(80);
  });

  it('should clamp player position to 0-100', () => {
    useTacticStore.getState().updatePlayerPosition(1, 150, -20);
    const player = useTacticStore.getState().frames[0].players.find(p => p.playerId === 1);
    expect(player?.x).toBe(100);
    expect(player?.y).toBe(0);
  });

  it('should update ball position', () => {
    useTacticStore.getState().updateBallPosition(30, 40);
    const ball = useTacticStore.getState().frames[0].ball;
    expect(ball.x).toBe(30);
    expect(ball.y).toBe(40);
  });

  it('should clamp ball position to 0-100', () => {
    useTacticStore.getState().updateBallPosition(110, -5);
    const ball = useTacticStore.getState().frames[0].ball;
    expect(ball.x).toBe(100);
    expect(ball.y).toBe(0);
  });

  it('should select player', () => {
    useTacticStore.getState().selectPlayer(5);
    expect(useTacticStore.getState().selectedPlayerId).toBe(5);
    expect(useTacticStore.getState().selectedBall).toBe(false);
  });

  it('should select ball and deselect player', () => {
    useTacticStore.getState().selectPlayer(5);
    useTacticStore.getState().selectBall(true);
    expect(useTacticStore.getState().selectedPlayerId).toBeNull();
    expect(useTacticStore.getState().selectedBall).toBe(true);
  });

  it('should set tactic metadata', () => {
    useTacticStore.getState().setTacticMeta({ name: 'Konter', tags: ['4-3-3'] });
    const state = useTacticStore.getState();
    expect(state.name).toBe('Konter');
    expect(state.tags).toEqual(['4-3-3']);
    expect(state.isDirty).toBe(true);
  });

  it('should get frame data', () => {
    const data = useTacticStore.getState().getFrameData();
    expect(data.frames).toHaveLength(1);
    expect(data.animationSpeed).toBe(1.0);
    expect(data.pitchType).toBe('full');
  });

  it('should have exactly one GK in default formation', () => {
    const players = useTacticStore.getState().frames[0].players;
    const gkCount = players.filter(p => p.position === 'GK').length;
    expect(gkCount).toBe(1);
  });

  it('should copy players to new frame', () => {
    useTacticStore.getState().updatePlayerPosition(1, 75, 85);
    useTacticStore.getState().addFrame('Copy');
    const newFrame = useTacticStore.getState().frames[1];
    const gk = newFrame.players.find(p => p.playerId === 1);
    expect(gk?.x).toBe(75);
    expect(gk?.y).toBe(85);
  });
});
