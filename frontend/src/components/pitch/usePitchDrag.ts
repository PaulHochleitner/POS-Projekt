import { useState, useCallback, type RefObject } from 'react';
import { hitTestPlayer, hitTestBall, canvasToPercent } from './pitchRenderer';
import type { Frame } from '../../types';

interface DragState {
  dragging: 'player' | 'ball' | null;
  draggedPlayerId: number | null;
}

interface UsePitchDragOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  frame: Frame;
  onPlayerMove: (playerId: number, x: number, y: number) => void;
  onBallMove: (x: number, y: number) => void;
  onSelect: (playerId: number | null, ball: boolean) => void;
  disabled?: boolean;
}

export function usePitchDrag({
  canvasRef, width, height, frame, onPlayerMove, onBallMove, onSelect, disabled,
}: UsePitchDragOptions) {
  const [dragState, setDragState] = useState<DragState>({ dragging: null, draggedPlayerId: null });

  const getCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0] as const;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY] as const;
  }, [canvasRef, width, height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    const [cx, cy] = getCoords(e);

    const hit = hitTestPlayer(cx, cy, width, height, frame.players, frame.opponents);
    if (hit !== null) {
      setDragState({ dragging: 'player', draggedPlayerId: hit.playerId });
      onSelect(hit.playerId, false);
      return;
    }

    if (hitTestBall(cx, cy, width, height, frame.ball)) {
      setDragState({ dragging: 'ball', draggedPlayerId: null });
      onSelect(null, true);
      return;
    }

    setDragState({ dragging: null, draggedPlayerId: null });
    onSelect(null, false);
  }, [disabled, getCoords, width, height, frame, onSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled || !dragState.dragging) return;
    const [cx, cy] = getCoords(e);
    const [px, py] = canvasToPercent(cx, cy, width, height);

    if (dragState.dragging === 'player' && dragState.draggedPlayerId !== null) {
      onPlayerMove(dragState.draggedPlayerId, px, py);
    } else if (dragState.dragging === 'ball') {
      onBallMove(px, py);
    }
  }, [disabled, dragState, getCoords, width, height, onPlayerMove, onBallMove]);

  const handleMouseUp = useCallback(() => {
    setDragState({ dragging: null, draggedPlayerId: null });
  }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}
