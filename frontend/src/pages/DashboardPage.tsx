import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { tacticApi } from '../api/tacticApi';
import { teamApi } from '../api/teamApi';
import type { Tactic } from '../types';
import { Plus, Users, Layout, ArrowRight, TrendingUp, Calendar, Target } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-[#0f172a]/50 backdrop-blur-sm border border-slate-800/50 p-6 rounded-2xl flex items-center gap-5 transition-all hover:border-[#4ade80]/30 hover:shadow-[0_0_20px_rgba(74,222,128,0.05)]"
    >
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 shadow-inner`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [recentTactics, setRecentTactics] = useState<Tactic[]>([]);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    tacticApi.getAll().then(t => setRecentTactics(t.slice(0, 5))).catch(() => {});
    teamApi.getAll().then(t => setTeamCount(t.length)).catch(() => {});
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            <span className="text-[10px] font-black text-[#4ade80] uppercase tracking-[0.2em]">Live Analyse</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
            Willkommen zurück, <span className="text-[#4ade80]">Coach</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-xl">
            Deine Schaltzentrale für taktische Brillanz. Erstelle, animiere und perfektioniere deine Spielzüge.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(74, 222, 128, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/tactics/new')}
          className="flex items-center gap-3 px-8 py-4 bg-[#4ade80] text-[#020617] font-black rounded-2xl shadow-lg transition-all group"
        >
          <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>NEUE TAKTIK ERSTELLEN</span>
        </motion.button>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <StatCard label="Gespeicherte Taktiken" value={recentTactics.length} icon={Layout} color="bg-[#4ade80]" />
        <StatCard label="Aktive Teams" value={teamCount} icon={Users} color="bg-blue-500" />
        <StatCard label="Taktische Analyse" value="PRO" icon={Target} color="bg-purple-500" />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tactics List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#0f172a]/40 backdrop-blur-md border border-slate-800/50 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-8 flex items-center justify-between border-b border-slate-800/50">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Letzte Taktiken</h2>
              <p className="text-xs text-slate-500 font-medium">Deine aktuellsten Entwürfe und Analysen</p>
            </div>
            <button 
              onClick={() => navigate('/tactics')} 
              className="group flex items-center gap-2 text-sm font-bold text-[#4ade80] hover:text-[#22c55e] transition-colors"
            >
              Alle ansehen <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="p-4">
            {recentTactics.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600">
                  <Layout size={32} />
                </div>
                <p className="text-slate-500 font-bold">Noch keine Taktiken erstellt</p>
                <button 
                  onClick={() => navigate('/tactics/new')}
                  className="text-[#4ade80] text-sm font-bold underline-offset-4 hover:underline"
                >
                  Jetzt erste Taktik entwerfen
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTactics.map((t, idx) => (
                  <motion.button
                    key={t.id}
                    variants={item}
                    whileHover={{ x: 8, backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                    onClick={() => navigate(`/tactics/${t.id}`)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-transparent transition-all text-left group border border-transparent hover:border-slate-800/50"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-[#4ade80] group-hover:bg-[#4ade80]/10 transition-colors">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <span className="text-white font-bold group-hover:text-[#4ade80] transition-colors">{t.name}</span>
                        <div className="flex gap-2 mt-1.5">
                          {t.tags.length > 0 ? (
                            t.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md group-hover:bg-slate-700 transition-colors">{tag}</span>
                            ))
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md">Basis-Taktik</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(t.updatedAt).toLocaleDateString('de', { day: '2-digit', month: 'short' })}
                      </span>
                      <ChevronRight size={16} className="text-slate-700 group-hover:text-[#4ade80] transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Training Insights / Sidebar Dashboard */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <div className="bg-gradient-to-br from-[#4ade80] to-[#22c55e] p-8 rounded-3xl text-[#020617] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-2xl font-black tracking-tighter mb-2">Pro Training</h3>
            <p className="text-sm font-bold text-[#020617]/70 mb-6 leading-relaxed">Analysiere die neuesten Profi-Taktiken der Champions League.</p>
            <button className="w-full py-3 bg-[#020617] text-white text-xs font-black rounded-xl hover:scale-105 transition-transform shadow-lg">JETZT STARTEN</button>
          </div>

          <div className="bg-[#0f172a]/40 backdrop-blur-md border border-slate-800/50 p-8 rounded-3xl space-y-6">
            <h3 className="text-white font-black tracking-tight flex items-center gap-2">
              <TrendingUp size={18} className="text-[#4ade80]" />
              System Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Backend-Sync</span>
                <span className="text-[10px] font-black text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-full uppercase tracking-widest">Aktiv</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "95%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-[#4ade80]"
                ></motion.div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Alle Systeme laufen optimal. Deine Taktiken sind sicher in der Cloud gespeichert.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
