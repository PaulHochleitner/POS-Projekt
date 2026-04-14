import { useNavigate } from 'react-router-dom';
import { Clock, Layers, Tag } from 'lucide-react';
import type { Tactic } from '../../types';

export default function TacticCard({ tactic }: { tactic: Tactic }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/tactics/${tactic.id}`)}
      className="bg-[#1e293b] rounded-xl p-5 text-left border border-[#334155] hover:border-[#4ade80] transition-all hover:shadow-lg hover:shadow-[#4ade80]/5 group"
    >
      <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-[#4ade80] transition-colors">
        {tactic.name}
      </h3>
      {tactic.description && (
        <p className="text-[#94a3b8] text-sm mb-3 line-clamp-2">{tactic.description}</p>
      )}

      {tactic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tactic.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-[#334155] text-[#94a3b8] text-xs px-2 py-0.5 rounded-full">
              <Tag size={10} />{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-[#64748b]">
        {tactic.teamName && <span>{tactic.teamName}</span>}
        <span className="flex items-center gap-1"><Layers size={12} />{tactic.versionCount} Versionen</span>
        <span className="flex items-center gap-1"><Clock size={12} />{new Date(tactic.updatedAt).toLocaleDateString('de')}</span>
      </div>
    </button>
  );
}
