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

function interpolateRoster(from: PlayerPosition[], to: PlayerPosition[], t: number): PlayerPosition[] {
  return from.map((p, i) => {
    const target = to.find(tp => tp.playerId === p.playerId) ?? to[i] ?? p;
    return interpolatePlayer(p, target, t);
  });
}

export function interpolateFrame(from: Frame, to: Frame, t: number): Frame {
  return {
    index: from.index,
    label: t < 0.5 ? from.label : to.label,
    players: interpolateRoster(from.players, to.players, t),
    opponents: interpolateRoster(from.opponents ?? [], to.opponents ?? [], t),
    ball: interpolateBall(from.ball, to.ball, t),
  };
}
