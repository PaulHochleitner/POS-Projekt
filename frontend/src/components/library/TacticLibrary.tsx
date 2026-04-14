import { useState, useEffect } from 'react';
import { tacticApi } from '../../api/tacticApi';
import { tagApi } from '../../api/tagApi';
import TacticCard from './TacticCard';
import type { Tactic, TagDto } from '../../types';
import { Search, X } from 'lucide-react';

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
    tacticApi.getAll({
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      search: search || undefined,
    })
      .then(setTactics)
      .catch(() => setTactics([]))
      .finally(() => setLoading(false));
  }, [selectedTags, search]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div>
      {/* Search & Filter */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Taktik suchen..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1e293b] border border-[#334155] text-white text-sm focus:border-[#4ade80] focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag.name}
                onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag.name)
                    ? 'bg-[#4ade80] text-[#0f172a]'
                    : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
                }`}
              >
                {tag.name} ({tag.usageCount})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#1e293b] rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : tactics.length === 0 ? (
        <div className="text-center py-16 text-[#64748b]">
          <p className="text-lg">Keine Taktiken gefunden</p>
          <p className="text-sm mt-1">Erstelle eine neue Taktik um loszulegen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tactics.map(t => <TacticCard key={t.id} tactic={t} />)}
        </div>
      )}
    </div>
  );
}
