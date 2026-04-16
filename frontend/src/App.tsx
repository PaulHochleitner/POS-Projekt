import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Home, Layout, Users, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/useAuthStore';
import DashboardPage from './pages/DashboardPage';
import TacticEditorPage from './pages/TacticEditorPage';
import TacticLibraryPage from './pages/TacticLibraryPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import VersionComparePage from './pages/VersionComparePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
          isActive
            ? "bg-[#4ade80]/10 text-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.1)]"
            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="nav-active"
              className="absolute left-0 w-1 h-6 bg-[#4ade80] rounded-r-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <Icon size={18} className={cn("transition-transform duration-300 group-hover:scale-110", isActive && "text-[#4ade80]")} />
          <span className="flex-1">{label}</span>
          {isActive && <ChevronRight size={14} className="opacity-50" />}
        </>
      )}
    </NavLink>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tactics" element={<TacticLibraryPage />} />
          <Route path="/tactics/new" element={<TacticEditorPage />} />
          <Route path="/tactics/:id" element={<TacticEditorPage />} />
          <Route path="/tactics/:id/compare" element={<VersionComparePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppLayout() {
  const { username, logout } = useAuthStore();

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <nav className="w-[260px] bg-[#0f172a] border-r border-slate-800/50 p-6 flex flex-col gap-2 flex-shrink-0 z-20">
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-[#4ade80] rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-10 h-10 bg-[#4ade80] rounded-xl flex items-center justify-center text-[#020617] font-black text-lg shadow-lg">FT</div>
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight leading-tight">Tactics Sim</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Pro Edition</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <NavItem to="/" icon={Home} label="Dashboard" />
          <NavItem to="/tactics" icon={Layout} label="Taktik-Bibliothek" />
          <NavItem to="/teams" icon={Users} label="Team-Management" />
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800/50 space-y-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4ade80] to-[#22c55e] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{username}</p>
              <p className="text-[10px] text-slate-500">Trainer</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all w-full group"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" /> 
            <span>Abmelden</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto stadium-gradient">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pitch-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4ade80]/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
        
        <div className="relative z-10 p-8 min-h-full">
          <AnimatedRoutes />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { initFromStorage } = useAuthStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
