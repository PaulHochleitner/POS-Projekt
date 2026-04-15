import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TacticLibrary from '../components/library/TacticLibrary';
import { Plus, LayoutGrid } from 'lucide-react';

export default function TacticLibraryPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            <span className="text-[10px] font-black text-[#4ade80] uppercase tracking-[0.2em]">Strategie Archiv</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 leading-none">
            <LayoutGrid className="text-[#4ade80]" size={36} />
            Taktik-Bibliothek
          </h1>
          <p className="text-slate-500 font-medium text-lg">Deine Sammlung an Spielzügen und Formationen</p>
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

      <TacticLibrary />
    </div>
  );
}
