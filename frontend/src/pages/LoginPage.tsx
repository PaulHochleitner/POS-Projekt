import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { User, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      // error is set in store
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 relative overflow-hidden stadium-gradient">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pitch-pattern opacity-[0.05] pointer-events-none"></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#4ade80]/5 rounded-full blur-[120px] pointer-events-none"
      ></motion.div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"
      ></motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="text-center mb-10 space-y-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-[#4ade80] rounded-[28px] text-[#020617] font-black text-3xl shadow-[0_20px_40px_rgba(74,222,128,0.2)] mb-4"
          >
            FT
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
            Tactics <span className="text-[#4ade80]">Sim</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
            Professional Football Analytics
          </p>
        </div>

        <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-slate-800/50 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4ade80]/50 to-transparent"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm font-bold"
                >
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Benutzername</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4ade80] transition-colors" />
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Dein Name"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white text-sm font-bold focus:border-[#4ade80]/50 focus:ring-4 focus:ring-[#4ade80]/5 transition-all outline-none placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Passwort</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#4ade80] transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-white text-sm font-bold focus:border-[#4ade80]/50 focus:ring-4 focus:ring-[#4ade80]/5 transition-all outline-none placeholder:text-slate-700"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(74, 222, 128, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#4ade80] text-[#020617] font-black text-base shadow-lg transition-all disabled:opacity-50 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin" />
              ) : (
                <>
                  <span>ANMELDEN</span>
                  <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-sm font-bold text-slate-500">
              Noch kein Konto?{' '}
              <Link to="/register" className="text-[#4ade80] hover:text-[#22c55e] transition-colors">Jetzt Registrieren</Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] mt-8 opacity-50">
          © 2026 Football Tactics Simulator
        </p>
      </motion.div>
    </div>
  );
}
