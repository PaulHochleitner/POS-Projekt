import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTacticStore } from '../../store/useTacticStore';
import { usePlaybackStore } from '../../store/usePlaybackStore';
import { drawFrame, hitTestPlayer, hitTestBall, canvasToPercent, setRedrawCallback } from './pitchRenderer';
import { interpolateFrame } from './interpolation';
import type { Frame } from '../../types';
import { Maximize2, MousePointer2, Play } from 'lucide-react';

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group bg-[#0f172a] rounded-[32px] p-4 border border-slate-800/50 shadow-2xl shadow-black/50 overflow-hidden"
    >
      {/* Stadium Floodlight Glows */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-[#4ade80]/40 to-transparent blur-sm"></div>
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#4ade80]/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative rounded-[24px] overflow-hidden border border-slate-800/50">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair w-full bg-[#064e3b]"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Overlay HUD */}
        <div className="absolute top-6 left-6 flex items-center gap-3 pointer-events-none">
          <div className="bg-[#020617]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Engine</span>
          </div>
          {isPlaying && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#4ade80] px-3 py-1.5 rounded-lg flex items-center gap-2"
            >
              <Play size={12} fill="currentColor" className="text-[#020617]" />
              <span className="text-[10px] font-black text-[#020617] uppercase tracking-widest">Simulating</span>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-6 right-6 flex items-center gap-2">
          <button className="p-3 rounded-xl bg-[#020617]/60 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-[#020617]/80 transition-all">
            <Maximize2 size={18} />
          </button>
        </div>

        {/* Interaction Hint */}
        {!readOnly && !isPlaying && !dragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <div className="bg-[#020617]/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <MousePointer2 size={12} className="text-[#4ade80]" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Spieler ziehen zum Bearbeiten</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
