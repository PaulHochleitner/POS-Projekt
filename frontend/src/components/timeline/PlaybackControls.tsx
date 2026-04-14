import { usePlaybackStore } from '../../store/usePlaybackStore';
import { useTacticStore } from '../../store/useTacticStore';
import { Play, Pause, Square, Repeat } from 'lucide-react';

const SPEEDS = [0.25, 0.5, 1, 2];

export default function PlaybackControls() {
  const { isPlaying, speed, currentTime, isLooping, play, pause, stop, setSpeed, toggleLoop } = usePlaybackStore();
  const { frames } = useTacticStore();
  const canPlay = frames.length >= 2;

  return (
    <div className="bg-[#1e293b] rounded-xl p-4 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={isPlaying ? pause : play}
          disabled={!canPlay}
          className="p-2 rounded-lg bg-[#4ade80] text-[#0f172a] hover:bg-[#22c55e] transition-colors disabled:opacity-30"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          onClick={stop}
          className="p-2 rounded-lg bg-[#334155] text-[#94a3b8] hover:bg-[#475569] transition-colors"
          title="Stop"
        >
          <Square size={20} />
        </button>
        <button
          onClick={toggleLoop}
          className={`p-2 rounded-lg transition-colors ${
            isLooping ? 'bg-[#4ade80] text-[#0f172a]' : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
          }`}
          title="Loop"
        >
          <Repeat size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex-1 h-2 bg-[#334155] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#4ade80] rounded-full transition-all duration-100"
          style={{ width: `${currentTime * 100}%` }}
        />
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        {SPEEDS.map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
              speed === s ? 'bg-[#4ade80] text-[#0f172a]' : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
