import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tacticApi } from '../../api/tacticApi';
import { tagApi } from '../../api/tagApi';
import TacticCard from './TacticCard';
import type { Tactic, TagDto } from '../../types';
import { Search, X, Filter, SlidersHorizontal, LayoutGrid } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function TacticLibrary() {
  const [tactics, setTactics] = useState<Tactic[]>([]);
  const [allTags, setAllTags] = useState<TagDto[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tagApi.getAll().then(setAllTags).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      tacticApi.getAll({
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        search: search || undefined,
      })
        .then(setTactics)
        .catch(() => setTactics([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [selectedTags, search]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <LayoutGrid className="text-[#4ade80]" size={28} />
            Taktik-Bibliothek
          </h2>
          <p className="text-slate-500 font-medium text-sm">Verwalte und durchsuche deine taktischen Meisterwerke</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#4ade80] transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Taktik suchen..."
              className="w-full md:w-[300px] pl-12 pr-10 py-3.5 rounded-2xl bg-[#0f172a]/50 backdrop-blur-sm border border-slate-800/50 text-white text-sm font-bold focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/20 transition-all outline-none placeholder:text-slate-600"
            />
            <AnimatePresence>
              {search && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearch('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <button className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all">
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Tags Filter Bar */}
      {allTags.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/50"
        >
          <div className="flex items-center gap-2 px-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800 mr-2">
            <Filter size={12} /> Filter
          </div>
          {allTags.map(tag => {
            const isActive = selectedTags.includes(tag.name);
            return (
              <motion.button
                key={tag.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTag(tag.name)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border",
                  isActive
                    ? "bg-[#4ade80] text-[#020617] border-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                    : "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300"
                )}
              >
                {tag.name} <span className={cn("ml-1 opacity-50", isActive ? "text-[#020617]" : "text-slate-600")}>{tag.usageCount}</span>
              </motion.button>
            );
          })}
          {selectedTags.length > 0 && (
            <button 
              onClick={() => setSelectedTags([])}
              className="ml-auto text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest px-3"
            >
              Reset
            </button>
          )}
        </motion.div>
      )}

      {/* Content Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#0f172a]/50 border border-slate-800/50 rounded-3xl h-56 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
            ))}
          </motion.div>
        ) : tactics.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-3xl"
          >
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-slate-700">
              <Search size={40} />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-black text-white tracking-tight">Keine Ergebnisse</p>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">Wir konnten keine Taktiken finden, die deiner Suche entsprechen.</p>
            </div>
            <button 
              onClick={() => { setSearch(''); setSelectedTags([]); }}
              className="px-6 py-2.5 bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-slate-700 transition-colors uppercase tracking-widest"
            >
              Filter zurücksetzen
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {tactics.map(t => (
              <TacticCard key={t.id} tactic={t} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
