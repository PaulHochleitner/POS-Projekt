import { useRef, useEffect, useCallback, useState } from 'react';
import { useTacticStore } from '../../store/useTacticStore';
import { usePlaybackStore } from '../../store/usePlaybackStore';
import { drawFrame, hitTestPlayer, hitTestBall, canvasToPercent, setRedrawCallback } from './pitchRenderer';
import { interpolateFrame } from './interpolation';
import type { Frame } from '../../types';

interface PitchCanvasProps {
  width?: number;
  height?: number;
  readOnly?: boolean;
  overrideFrame?: Frame;
}

export default function PitchCanvas({
  width = 800,
  height = 520,
  readOnly = false,
  overrideFrame,
}: PitchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [dragging, setDragging] = useState<'player' | 'ball' | null>(null);

  const {
    frames, currentFrameIndex, selectedPlayerId, selectedTeam, selectedBall,
    homeColor, awayColor,
    updatePlayerPosition, updateBallPosition, selectPlayer, selectBall,
  } = useTacticStore();

  const { isPlaying, speed, currentTime, setCurrentTime, isLooping, stop } = usePlaybackStore();

  const currentFrame = overrideFrame ?? frames[currentFrameIndex];

  const render = useCallback((frame: Frame) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawFrame(
      ctx, width, height, frame,
      homeColor, awayColor,
      readOnly ? null : selectedPlayerId,
      readOnly ? null : selectedTeam,
      readOnly ? false : selectedBall,
    );
  }, [width, height, homeColor, awayColor, selectedPlayerId, selectedTeam, selectedBall, readOnly]);

  // Static render
  useEffect(() => {
    if (!isPlaying) render(currentFrame);
  }, [currentFrame, isPlaying, render]);

  // Re-render when an avatar image finishes loading
  useEffect(() => {
    setRedrawCallback(() => {
      if (!isPlaying && canvasRef.current) render(currentFrame);
    });
    return () => setRedrawCallback(null);
  }, [render, currentFrame, isPlaying]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length < 2) return;

    let startTime: number | null = null;
    const totalDuration = (frames.length - 1) * (2000 / speed);

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp - currentTime * totalDuration;
      const elapsed = timestamp - startTime;
      let t = elapsed / totalDuration;

      if (t >= 1) {
        if (isLooping) {
          startTime = timestamp;
          t = 0;
        } else {
          stop();
          return;
        }
      }

      setCurrentTime(t);

      const segmentCount = frames.length - 1;
      const globalT = t * segmentCount;
      const segIdx = Math.min(Math.floor(globalT), segmentCount - 1);
      const localT = globalT - segIdx;

      const interpolated = interpolateFrame(frames[segIdx], frames[segIdx + 1], localT);
      render(interpolated);

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, frames, speed, isLooping, render, setCurrentTime, stop, currentTime]);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY] as const;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || isPlaying) return;
    const [cx, cy] = getCanvasCoords(e);

    const hit = hitTestPlayer(cx, cy, width, height, currentFrame.players, currentFrame.opponents);
    if (hit) {
      selectPlayer(hit.playerId, hit.team);
      setDragging('player');
      return;
    }

    if (hitTestBall(cx, cy, width, height, currentFrame.ball)) {
      selectBall(true);
      setDragging('ball');
      return;
    }

    selectPlayer(null);
    selectBall(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || readOnly || isPlaying) return;
    const [cx, cy] = getCanvasCoords(e);
    const [px, py] = canvasToPercent(cx, cy, width, height);

    if (dragging === 'player' && selectedPlayerId !== null && selectedTeam !== null) {
      updatePlayerPosition(selectedTeam, selectedPlayerId, px, py);
    } else if (dragging === 'ball') {
      updateBallPosition(px, py);
    }
  };

  const handleMouseUp = () => setDragging(null);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl border-2 border-[#334155] cursor-crosshair w-full max-w-[800px]"
      style={{ aspectRatio: `${width}/${height}` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
