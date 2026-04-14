import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogIn } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#1e293b] rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Taktik Simulator</h1>
          <p className="text-[#94a3b8] text-sm mt-1">Melde dich an</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg p-3 text-sm text-[#ef4444]">{error}</div>
          )}

          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">Benutzername</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-[#334155] text-white focus:border-[#4ade80] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#94a3b8] mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0f172a] border border-[#334155] text-white focus:border-[#4ade80] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#4ade80] text-[#0f172a] font-semibold hover:bg-[#22c55e] transition-colors disabled:opacity-50"
          >
            <LogIn size={18} /> {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-sm text-[#94a3b8] mt-6">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-[#4ade80] hover:underline">Registrieren</Link>
        </p>
      </div>
    </div>
  );
}
