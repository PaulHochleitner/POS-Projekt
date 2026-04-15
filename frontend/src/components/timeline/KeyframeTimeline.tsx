import { motion, AnimatePresence } from 'framer-motion';
import { useTacticStore } from '../../store/useTacticStore';
import { Plus, Trash2, Layout, AlertCircle, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function KeyframeTimeline() {
  const { frames, currentFrameIndex, setCurrentFrame, addFrame, removeFrame } = useTacticStore();

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-[#0f172a]/60 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 flex flex-col gap-4 shadow-xl"
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[#4ade80]">
            <Layout size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Keyframe Timeline</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sequenz Planung</p>
          </div>
        </div>

        {frames.length < 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest"
          >
            <AlertCircle size={12} />
            Min. 2 Frames für Simulation
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 overflow-x-auto flex-1 py-2 no-scrollbar scroll-smooth">
          <AnimatePresence mode="popLayout">
            {frames.map((frame, i) => {
              const isActive = i === currentFrameIndex;
              return (
                <motion.button
                  key={i}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setCurrentFrame(i)}
                  className={cn(
                    "relative flex-shrink-0 min-w-[100px] px-4 py-3 rounded-2xl text-left transition-all duration-300 border group",
                    isActive
                      ? "bg-[#4ade80] text-[#020617] border-[#4ade80] shadow-[0_10px_20px_rgba(74,222,128,0.2)]"
                      : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em]",
                      isActive ? "text-[#020617]/60" : "text-slate-600 group-hover:text-slate-500"
                    )}>
                      Frame {i + 1}
                    </span>
                    <span className="text-xs font-black truncate max-w-[80px]">
                      {frame.label || `Spielzug ${i + 1}`}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="active-dot"
                      className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-[#4ade80]"
                    />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
          
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(74, 222, 128, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => addFrame()}
            className="flex-shrink-0 w-[100px] h-[54px] rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-700 hover:text-[#4ade80] hover:border-[#4ade80]/30 transition-all group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </motion.button>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0 border-l border-slate-800/50 pl-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => removeFrame(currentFrameIndex)}
            disabled={frames.length <= 1}
            className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed group"
          >
            <Trash2 size={18} />
          </motion.button>
          
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
