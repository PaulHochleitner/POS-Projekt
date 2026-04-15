import type { Frame, PlayerPosition, BallPosition, TeamSide } from '../../types';

const PITCH_COLOR = '#064e3b';
const PITCH_DARK = '#064736';
const LINE_COLOR = 'rgba(255, 255, 255, 0.8)';
const BALL_COLOR = '#ffffff';
const BALL_OUTLINE = '#000000';
const PLAYER_RADIUS = 16;
const BALL_RADIUS = 7;

const POSITION_COLORS: Record<string, string> = {
  GK: '#fbbf24', // Amber
  CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6', // Blue
  CDM: '#10b981', CM: '#10b981', CAM: '#10b981', LM: '#10b981', RM: '#10b981', // Emerald
  LW: '#f43f5e', RW: '#f43f5e', ST: '#f43f5e', // Rose
};

export function getPositionColor(position: string): string {
  return POSITION_COLORS[position] ?? '#64748b';
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
    imageCache.delete(url);
  };
  img.src = url;
  return null;
}

export function drawPitch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const margin = 40;
  const pw = w - 2 * margin;
  const ph = h - 2 * margin;

  // Background with subtle gradient
  const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
  grad.addColorStop(0, '#065f46');
  grad.addColorStop(1, '#064e3b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Grass Stripes
  const stripeCount = 12;
  const stripeW = pw / stripeCount;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillRect(margin + i * stripeW, margin, stripeW, ph);
  }

  // Lines
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer Boundary
  ctx.strokeRect(margin, margin, pw, ph);

  // Center Line
  ctx.beginPath();
  ctx.moveTo(w / 2, margin);
  ctx.lineTo(w / 2, h - margin);
  ctx.stroke();

  // Center Circle
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, ph * 0.2, 0, Math.PI * 2);
  ctx.stroke();

  // Center Spot
  ctx.fillStyle = LINE_COLOR;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Penalty Areas
  const paW = pw * 0.18;
  const paH = ph * 0.45;
  ctx.strokeRect(margin, h / 2 - paH / 2, paW, paH);
  ctx.strokeRect(w - margin - paW, h / 2 - paH / 2, paW, paH);

  // Goal Areas
  const gaW = pw * 0.06;
  const gaH = ph * 0.22;
  ctx.strokeRect(margin, h / 2 - gaH / 2, gaW, gaH);
  ctx.strokeRect(w - margin - gaW, h / 2 - gaH / 2, gaW, gaH);

  // Penalty Arcs
  ctx.beginPath();
  ctx.arc(margin + pw * 0.12, h / 2, ph * 0.1, -0.6, 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w - margin - pw * 0.12, h / 2, ph * 0.1, Math.PI - 0.6, Math.PI + 0.6);
  ctx.stroke();

  // Penalty Spots
  ctx.beginPath();
  ctx.arc(margin + pw * 0.12, h / 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w - margin - pw * 0.12, h / 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Goals (Physical look)
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  const goalDepth = 15;
  const goalH = ph * 0.18;
  
  // Left Goal
  ctx.strokeRect(margin - goalDepth, h / 2 - goalH / 2, goalDepth, goalH);
  // Right Goal
  ctx.strokeRect(w - margin, h / 2 - goalH / 2, goalDepth, goalH);

  // Corner Arcs
  const cornerR = 12;
  ctx.lineWidth = 2;
  ctx.strokeStyle = LINE_COLOR;
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
  const margin = 40;
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
      ctx.save();
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, PLAYER_RADIUS + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Outer ring (Position color)
    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.arc(px, py, PLAYER_RADIUS + 2, 0, Math.PI * 2);
    ctx.fill();

    // Player Body
    let drewImage = false;
    if (player.imageUrl) {
      const img = getOrLoadImage(player.imageUrl);
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, px - PLAYER_RADIUS, py - PLAYER_RADIUS, PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);
        ctx.restore();
        drewImage = true;
      }
    }

    if (!drewImage) {
      // Circle with gradient
      const pGrad = ctx.createRadialGradient(px - 5, py - 5, 2, px, py, PLAYER_RADIUS);
      pGrad.addColorStop(0, teamColor || '#1e293b');
      pGrad.addColorStop(1, '#000000');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Jersey number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(player.playerNumber), px, py);
    }

    // Player Name Tag
    if (player.playerName && player.playerName.trim().length > 0) {
      const name = player.playerName.toUpperCase();
      ctx.font = 'black 9px Inter, system-ui, sans-serif';
      const metrics = ctx.measureText(name);
      const bgW = metrics.width + 10;
      const bgH = 16;
      
      // Glassmorphism effect for name tag
      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      ctx.beginPath();
      ctx.roundRect(px - bgW / 2, py + PLAYER_RADIUS + 6, bgW, bgH, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(name, px, py + PLAYER_RADIUS + 17);
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
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(bx, by, BALL_RADIUS + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.stroke();
    ctx.restore();
  }

  // Ball with subtle shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = BALL_OUTLINE;
  ctx.beginPath();
  ctx.arc(bx, by, BALL_RADIUS + 1, 0, Math.PI * 2);
  ctx.fill();

  const bGrad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, BALL_RADIUS);
  bGrad.addColorStop(0, '#ffffff');
  bGrad.addColorStop(1, '#d1d5db');
  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Pentagons on ball
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(bx, by, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
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
    if (Math.sqrt((x - px) ** 2 + (y - py) ** 2) <= PLAYER_RADIUS + 10) {
      return { team: 'home', playerId: player.playerId };
    }
  }
  for (const player of [...awayPlayers].reverse()) {
    const [px, py] = toCanvas(player.x, player.y, w, h);
    if (Math.sqrt((x - px) ** 2 + (y - py) ** 2) <= PLAYER_RADIUS + 10) {
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
  return Math.sqrt((x - bx) ** 2 + (y - by) ** 2) <= BALL_RADIUS + 10;
}

export function canvasToPercent(
  canvasX: number, canvasY: number, w: number, h: number,
): [number, number] {
  const margin = 40;
  const x = ((canvasX - margin) / (w - 2 * margin)) * 100;
  const y = ((canvasY - margin) / (h - 2 * margin)) * 100;
  return [Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))];
}
