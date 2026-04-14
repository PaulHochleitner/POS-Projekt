import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Home, Layout, Users, LogOut } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import DashboardPage from './pages/DashboardPage';
import TacticEditorPage from './pages/TacticEditorPage';
import TacticLibraryPage from './pages/TacticLibraryPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import VersionComparePage from './pages/VersionComparePage';
import SharedViewPage from './pages/SharedViewPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#4ade80]/10 text-[#4ade80]'
            : 'text-[#94a3b8] hover:text-white hover:bg-[#334155]'
        }`
      }
    >
      <Icon size={18} />
      {label}
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

function AppLayout() {
  const { username, logout } = useAuthStore();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="w-[220px] bg-[#1e1e2e] border-r border-[#334155] p-4 flex flex-col gap-1 flex-shrink-0">
        <div className="flex items-center gap-2 px-4 py-3 mb-4">
          <div className="w-8 h-8 bg-[#4ade80] rounded-lg flex items-center justify-center text-[#0f172a] font-bold text-sm">FT</div>
          <span className="text-white font-bold text-sm">Tactics Sim</span>
        </div>
        <NavItem to="/" icon={Home} label="Dashboard" />
        <NavItem to="/tactics" icon={Layout} label="Taktiken" />
        <NavItem to="/teams" icon={Users} label="Teams" />

        <div className="mt-auto border-t border-[#334155] pt-3">
          <div className="px-4 py-2 text-sm text-[#94a3b8] truncate">{username}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white hover:bg-[#334155] transition-colors w-full"
          >
            <LogOut size={16} /> Abmelden
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tactics" element={<TacticLibraryPage />} />
          <Route path="/tactics/new" element={<TacticEditorPage />} />
          <Route path="/tactics/:id" element={<TacticEditorPage />} />
          <Route path="/tactics/:id/compare" element={<VersionComparePage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
        </Routes>
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
        <Route path="/shared/:uuid" element={<SharedViewPage />} />

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
