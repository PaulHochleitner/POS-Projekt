import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Layers, Tag, Shield, ChevronRight, TrendingUp } from 'lucide-react';
import type { Tactic } from '../../types';

export default function TacticCard({ tactic }: { tactic: Tactic }) {
  const navigate = useNavigate();

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.button
      variants={item}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/tactics/${tactic.id}`)}
      className="group relative bg-[#0f172a]/50 backdrop-blur-sm rounded-3xl p-6 text-left border border-slate-800/50 hover:border-[#4ade80]/30 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col h-full overflow-hidden"
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ade80]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#4ade80]/10 transition-colors duration-500"></div>
      
      {/* Header with Icon and Version */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 group-hover:bg-[#4ade80]/10 group-hover:border-[#4ade80]/20 transition-colors">
          <TrendingUp size={20} className="text-slate-500 group-hover:text-[#4ade80] transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:border-slate-700 transition-colors">
          <Layers size={10} />
          {tactic.versionCount} {tactic.versionCount === 1 ? 'Version' : 'Versionen'}
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-2 flex-1">
        <h3 className="text-xl font-black text-white tracking-tight group-hover:text-[#4ade80] transition-colors line-clamp-1">
          {tactic.name}
        </h3>
        {tactic.description ? (
          <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">
            {tactic.description}
          </p>
        ) : (
          <p className="text-slate-600 text-[10px] font-bold italic uppercase tracking-wider">
            Keine Beschreibung hinterlegt
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-6 mb-6 min-h-[22px]">
        {tactic.tags.length > 0 ? (
          tactic.tags.slice(0, 3).map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-slate-900/80 text-slate-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-slate-800 group-hover:border-slate-700 transition-colors">
              <Tag size={8} />
              {tag}
            </span>
          ))
        ) : (
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">#Uncategorized</span>
        )}
      </div>

      {/* Footer */}
      <div className="pt-5 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-white uppercase tracking-tight">
            <Shield size={10} className="text-[#4ade80]" />
            {tactic.teamName || 'Standard Team'}
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            <Clock size={10} />
            {new Date(tactic.updatedAt).toLocaleDateString('de', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 group-hover:bg-[#4ade80] group-hover:text-[#020617] transition-all transform group-hover:translate-x-1">
          <ChevronRight size={16} strokeWidth={3} />
        </div>
      </div>
    </motion.button>
  );
}
