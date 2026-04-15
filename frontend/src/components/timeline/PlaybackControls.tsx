import { motion } from 'framer-motion';
import { usePlaybackStore } from '../../store/usePlaybackStore';
import { useTacticStore } from '../../store/useTacticStore';
import { Play, Pause, Square, Repeat, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SPEEDS = [0.25, 0.5, 1, 2];

export default function PlaybackControls() {
  const { isPlaying, speed, currentTime, isLooping, play, pause, stop, setSpeed, toggleLoop } = usePlaybackStore();
  const { frames } = useTacticStore();
  const canPlay = frames.length >= 2;

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 flex items-center gap-8 shadow-2xl"
    >
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPlaying ? pause : play}
          disabled={!canPlay}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
            isPlaying 
              ? "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700" 
              : "bg-[#4ade80] text-[#020617] hover:bg-[#22c55e] shadow-[#4ade80]/20"
          )}
        >
          {isPlaying ? <Pause size={24} strokeWidth={2.5} /> : <Play size={24} fill="currentColor" strokeWidth={0} />}
        </motion.button>

        <div className="flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={stop}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700 transition-all"
          >
            <Square size={16} fill="currentColor" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleLoop}
            className={cn(
              "p-2 rounded-xl border transition-all",
              isLooping 
                ? "bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]" 
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-white"
            )}
          >
            <Repeat size={16} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Simulation Progress</span>
          <span className="text-[10px] font-black text-[#4ade80] font-mono">{Math.round(currentTime * 100)}%</span>
        </div>
        <div className="relative h-3 bg-slate-900 rounded-full border border-slate-800 overflow-hidden group">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#4ade80]/50 to-[#4ade80] rounded-full"
            style={{ width: `${currentTime * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_1s_linear_infinite]"></div>
          </motion.div>
        </div>
      </div>

      {/* Speed Control */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
          <Zap size={10} /> Speed
        </div>
        <div className="flex items-center p-1.5 bg-slate-900 rounded-2xl border border-slate-800 gap-1">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black transition-all",
                speed === s 
                  ? "bg-slate-800 text-[#4ade80] shadow-sm border border-slate-700" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
