import { motion } from 'framer-motion';
import TeamManager from '../components/teams/TeamManager';
import { Users } from 'lucide-react';

export default function TeamsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Kader Verwaltung</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
          <Users className="text-[#4ade80]" size={36} />
          Team Management
        </h1>
        <p className="text-slate-500 font-medium text-lg">Konfiguriere deine Mannschaften und optimiere die Spieler-Attribute</p>
      </motion.div>

      <TeamManager />
    </div>
  );
}
