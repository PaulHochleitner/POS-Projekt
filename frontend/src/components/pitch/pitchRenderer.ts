import type { Frame, PlayerPosition, BallPosition, TeamSide } from '../../types';

const PITCH_COLOR = '#2d8a4e';
const PITCH_DARK = '#236b3d';
const LINE_COLOR = '#ffffff';
const BALL_COLOR = '#ffffff';
const BALL_OUTLINE = '#1e1e1e';
const PLAYER_RADIUS = 18;
const BALL_RADIUS = 8;

const POSITION_COLORS: Record<string, string> = {
  GK: '#EAB308',
  CB: '#3B82F6', LB: '#3B82F6', RB: '#3B82F6',
  CDM: '#22C55E', CM: '#22C55E', CAM: '#22C55E', LM: '#22C55E', RM: '#22C55E',
  LW: '#EF4444', RW: '#EF4444', ST: '#EF4444',
};

export function getPositionColor(position: string): string {
  return POSITION_COLORS[position] ?? '#94a3b8';
}

// --- Image cache for player avatars ---
type ImageState = { img: HTMLImageElement; loaded: boolean };
const imageCache: Map<string, ImageState> = new Map();
let redrawCallback: (() => void) | null = null;

export function setRedrawCallback(cb: (() => void) | null) {
  redrawCallback = cb;
}

function getOrLoadImage(url: string): HTMLImageElement | null {
  const cached = imageCache.get(url);
  if (cached) return cached.loaded ? cached.img : null;

  const img = new Image();
  const state: ImageState = { img, loaded: false };
  imageCache.set(url, state);
  img.onload = () => {
    state.loaded = true;
    if (redrawCallback) redrawCallback();
  };
  img.onerror = () => {
    // mark as failed by removing — fallback to number stays
    imageCache.delete(url);
  };
  img.src = url;
  return null;
}

export function drawPitch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const margin = 30;
  const pw = w - 2 * margin;
  const ph = h - 2 * margin;

  ctx.fillStyle = PITCH_COLOR;
  ctx.fillRect(0, 0, w, h);
  const stripeW = pw / 10;
  ctx.fillStyle = PITCH_DARK;
  for (let i = 0; i < 10; i += 2) {
    ctx.fillRect(margin + i * stripeW, margin, stripeW, ph);
  }

  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 2;

  ctx.strokeRect(margin, margin, pw, ph);

  ctx.beginPath();
  ctx.moveTo(w / 2, margin);
  ctx.lineTo(w / 2, h - margin);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(pw, ph) * 0.1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = LINE_COLOR;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  const paW = pw * 0.16;
  const paH = ph * 0.44;
  ctx.strokeRect(margin, h / 2 - paH / 2, paW, paH);
  ctx.strokeRect(w - margin - paW, h / 2 - paH / 2, paW, paH);

  const gaW = pw * 0.06;
  const gaH = ph * 0.22;
  ctx.strokeRect(margin, h / 2 - gaH / 2, gaW, gaH);
  ctx.strokeRect(w - margin - gaW, h / 2 - gaH / 2, gaW, gaH);

  const goalW = 6;
  const goalH = ph * 0.14;
  ctx.fillStyle = '#ffffff44';
  ctx.fillRect(margin - goalW, h / 2 - goalH / 2, goalW, goalH);
  ctx.fillRect(w - margin, h / 2 - goalH / 2, goalW, goalH);

  ctx.fillStyle = LINE_COLOR;
  ctx.beginPath();
  ctx.arc(margin + pw * 0.12, h / 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w - margin - pw * 0.12, h / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  const cornerR = 10;
  for (const [cx, cy, startAngle] of [
    [margin, margin, 0],
    [w - margin, margin, Math.PI / 2],
    [w - margin, h - margin, Math.PI],
    [margin, h - margin, Math.PI * 1.5],
  ] as [number, number, number][]) {
    ctx.beginPath();
    ctx.arc(cx, cy, cornerR, startAngle, startAngle + Math.PI / 2);
    ctx.stroke();
  }
}

function toCanvas(x: number, y: number, w: number, h: number): [number, number] {
  const margin = 30;
  return [margin + (x / 100) * (w - 2 * margin), margin + (y / 100) * (h - 2 * margin)];
}

export function drawPlayers(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  players: PlayerPosition[],
  teamColor: string,
  selectedPlayerId: number | null,
) {
  for (const player of players) {
    const [px, py] = toCanvas(player.x, player.y, w, h);
    const borderColor = getPositionColor(player.position);
    const isSelected = player.playerId === selectedPlayerId;

    if (isSelected) {
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 20;
    }

    // Outer border (position color)
    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_RADIUS + 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Inner circle (team color or image)
    let drewImage = false;
    if (player.imageUrl) {
      const img = getOrLoadImage(player.imageUrl);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, px - PLAYER_RADIUS, py - PLAYER_RADIUS, PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
        ctx.restore();
        drewImage = true;
      }
    }

    if (!drewImage) {
      ctx.fillStyle = teamColor || '#1e3a5f';
      ctx.beginPath();
      ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Jersey number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(player.playerNumber), px, py);
    }

    // Player name below the circle (only if non-empty)
    if (player.playerName && player.playerName.trim().length > 0) {
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const name = player.playerName.length > 14 ? player.playerName.slice(0, 13) + '.' : player.playerName;
      // Background for legibility
      const metrics = ctx.measureText(name);
      const bgW = metrics.width + 6;
      const bgH = 14;
      ctx.fillStyle = 'rgba(15,23,42,0.75)';
      ctx.fillRect(px - bgW / 2, py + PLAYER_RADIUS + 4, bgW, bgH);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, px, py + PLAYER_RADIUS + 11);
    }
  }
}

export function drawBall(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  ball: BallPosition,
  isSelected: boolean,
) {
  const [bx, by] = toCanvas(ball.x, ball.y, w, h);

  if (isSelected) {
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 15;
  }

  ctx.fillStyle = BALL_OUTLINE;
  ctx.beginPath();
  ctx.arc(bx, by, BALL_RADIUS + 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BALL_COLOR;
  ctx.beginPath();
  ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  frame: Frame,
  homeColor: string,
  awayColor: string,
  selectedPlayerId: number | null,
  selectedTeam: TeamSide | null,
  selectedBall: boolean,
) {
  drawPitch(ctx, w, h);
  drawBall(ctx, w, h, frame.ball, selectedBall);
  drawPlayers(ctx, w, h, frame.players, homeColor, selectedTeam === 'home' ? selectedPlayerId : null);
  drawPlayers(ctx, w, h, frame.opponents, awayColor, selectedTeam === 'away' ? selectedPlayerId : null);
}

export interface PlayerHit {
  team: TeamSide;
  playerId: number;
}

export function hitTestPlayer(
  x: number, y: number, w: number, h: number,
  homePlayers: PlayerPosition[],
  awayPlayers: PlayerPosition[],
): PlayerHit | null {
  for (const player of [...homePlayers].reverse()) {
    const [px, py] = toCanvas(player.x, player.y, w, h);
    if (Math.sqrt((x - px) ** 2 + (y - py) ** 2) <= PLAYER_RADIUS + 5) {
      return { team: 'home', playerId: player.playerId };
    }
  }
  for (const player of [...awayPlayers].reverse()) {
    const [px, py] = toCanvas(player.x, player.y, w, h);
    if (Math.sqrt((x - px) ** 2 + (y - py) ** 2) <= PLAYER_RADIUS + 5) {
      return { team: 'away', playerId: player.playerId };
    }
  }
  return null;
}

export function hitTestBall(
  x: number, y: number, w: number, h: number,
  ball: BallPosition,
): boolean {
  const [bx, by] = toCanvas(ball.x, ball.y, w, h);
  return Math.sqrt((x - bx) ** 2 + (y - by) ** 2) <= BALL_RADIUS + 5;
}

export function canvasToPercent(
  canvasX: number, canvasY: number, w: number, h: number,
): [number, number] {
  const margin = 30;
  const x = ((canvasX - margin) / (w - 2 * margin)) * 100;
  const y = ((canvasY - margin) / (h - 2 * margin)) * 100;
  return [Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))];
}
