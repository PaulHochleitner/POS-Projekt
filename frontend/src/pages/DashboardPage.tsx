import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tacticApi } from '../api/tacticApi';
import { teamApi } from '../api/teamApi';
import type { Tactic } from '../types';
import { Plus, Users, Layout, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [recentTactics, setRecentTactics] = useState<Tactic[]>([]);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    tacticApi.getAll().then(t => setRecentTactics(t.slice(0, 5))).catch(() => {});
    teamApi.getAll().then(t => setTeamCount(t.length)).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Football Tactics Simulator</h1>
        <p className="text-[#94a3b8]">Erstelle, animiere und teile taktische Spielzüge</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/tactics/new')}
          className="flex items-center gap-4 p-5 bg-gradient-to-br from-[#4ade80]/20 to-[#4ade80]/5 border border-[#4ade80]/30 rounded-xl text-left hover:border-[#4ade80] transition-all group"
        >
          <div className="p-3 bg-[#4ade80] rounded-xl text-[#0f172a]"><Plus size={24} /></div>
          <div>
            <p className="text-white font-semibold group-hover:text-[#4ade80]">Neue Taktik</p>
            <p className="text-sm text-[#64748b]">Taktik erstellen</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/teams')}
          className="flex items-center gap-4 p-5 bg-[#1e293b] border border-[#334155] rounded-xl text-left hover:border-[#4ade80] transition-all group"
        >
          <div className="p-3 bg-[#334155] rounded-xl text-[#94a3b8] group-hover:text-[#4ade80]"><Users size={24} /></div>
          <div>
            <p className="text-white font-semibold group-hover:text-[#4ade80]">Teams verwalten</p>
            <p className="text-sm text-[#64748b]">{teamCount} Teams</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/tactics')}
          className="flex items-center gap-4 p-5 bg-[#1e293b] border border-[#334155] rounded-xl text-left hover:border-[#4ade80] transition-all group"
        >
          <div className="p-3 bg-[#334155] rounded-xl text-[#94a3b8] group-hover:text-[#4ade80]"><Layout size={24} /></div>
          <div>
            <p className="text-white font-semibold group-hover:text-[#4ade80]">Taktik-Bibliothek</p>
            <p className="text-sm text-[#64748b]">{recentTactics.length} Taktiken</p>
          </div>
        </button>
      </div>

      {/* Recent Tactics */}
      <div className="bg-[#1e293b] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Letzte Taktiken</h2>
          <button onClick={() => navigate('/tactics')} className="flex items-center gap-1 text-sm text-[#4ade80] hover:text-[#22c55e]">
            Alle <ArrowRight size={14} />
          </button>
        </div>
        {recentTactics.length === 0 ? (
          <p className="text-[#64748b] text-sm py-8 text-center">Noch keine Taktiken erstellt</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTactics.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(`/tactics/${t.id}`)}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0f172a] hover:bg-[#334155] transition-colors text-left"
              >
                <div>
                  <span className="text-white text-sm font-medium">{t.name}</span>
                  {t.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {t.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-[#334155] text-[#94a3b8] px-1.5 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-[#64748b]">{new Date(t.updatedAt).toLocaleDateString('de')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
