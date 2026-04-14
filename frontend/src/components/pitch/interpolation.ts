import type { Frame, PlayerPosition, BallPosition } from '../../types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolatePlayer(from: PlayerPosition, to: PlayerPosition, t: number): PlayerPosition {
  return {
    ...from,
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
  };
}

export function interpolateBall(from: BallPosition, to: BallPosition, t: number): BallPosition {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    carriedByPlayerId: t < 0.5 ? from.carriedByPlayerId : to.carriedByPlayerId,
  };
}

export function interpolateFrame(from: Frame, to: Frame, t: number): Frame {
  const players = from.players.map((p, i) => {
    const target = to.players.find(tp => tp.playerId === p.playerId) ?? to.players[i] ?? p;
    return interpolatePlayer(p, target, t);
  });

  return {
    index: from.index,
    label: t < 0.5 ? from.label : to.label,
    players,
    ball: interpolateBall(from.ball, to.ball, t),
  };
}
