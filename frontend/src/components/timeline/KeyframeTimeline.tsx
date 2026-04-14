import { useTacticStore } from '../../store/useTacticStore';
import { Plus, Trash2 } from 'lucide-react';

export default function KeyframeTimeline() {
  const { frames, currentFrameIndex, setCurrentFrame, addFrame, removeFrame } = useTacticStore();

  return (
    <div className="bg-[#1e293b] rounded-xl p-4 flex items-center gap-3">
      <div className="flex items-center gap-2 overflow-x-auto flex-1 py-1">
        {frames.map((frame, i) => (
          <button
            key={i}
            onClick={() => setCurrentFrame(i)}
            className={`
              flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${i === currentFrameIndex
                ? 'bg-[#4ade80] text-[#0f172a] shadow-lg shadow-[#4ade80]/20'
                : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569] hover:text-white'}
            `}
            title={frame.label}
          >
            <span className="block text-xs opacity-70">F{i + 1}</span>
            <span className="block truncate max-w-[80px]">{frame.label}</span>
          </button>
        ))}
      </div>

      {frames.length < 2 && (
        <span className="text-xs text-[#fbbf24] flex-shrink-0">Min. 2 Keyframes fuer Animation</span>
      )}

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => addFrame()}
          className="p-2 rounded-lg bg-[#4ade80] text-[#0f172a] hover:bg-[#22c55e] transition-colors"
          title="Keyframe hinzufügen"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => removeFrame(currentFrameIndex)}
          disabled={frames.length <= 1}
          className="p-2 rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Keyframe löschen"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
