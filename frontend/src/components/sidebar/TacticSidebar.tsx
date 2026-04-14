import { useState, useEffect } from 'react';
import { useTacticStore } from '../../store/useTacticStore';
import { tacticApi } from '../../api/tacticApi';
import { teamApi } from '../../api/teamApi';
import type { Team } from '../../types';
import { Save, Share2, Download, Tag, X, Users, Shield } from 'lucide-react';

export default function TacticSidebar() {
  const {
    tacticId, name, description, isPublic, tags, uuid,
    teamId, opponentTeamId,
    setTacticMeta, getFrameData, setHomeTeam, setAwayTeam,
  } = useTacticStore();
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    teamApi.getAll().then(setTeams).catch(e => console.error('Could not load teams:', e));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const framesJson = JSON.stringify(getFrameData());
      if (tacticId) {
        await tacticApi.update(tacticId, { name, description, teamId, opponentTeamId, isPublic, tags });
        await tacticApi.createVersion(tacticId, { frames: framesJson });
      } else {
        const created = await tacticApi.create({ name, description, teamId, opponentTeamId, isPublic, tags, frames: framesJson });
        setTacticMeta({ tacticId: created.id, uuid: created.uuid });
      }
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportGif = async () => {
    if (!tacticId) return;
    const frameData = getFrameData();
    if (frameData.frames.length < 2) {
      alert('Fuer ein animiertes GIF muessen mindestens 2 Keyframes vorhanden sein. Fuege weitere Keyframes hinzu!');
      return;
    }
    setExporting(true);
    try {
      const versions = await tacticApi.getVersions(tacticId);
      if (versions.length === 0) return;
      const blob = await tacticApi.exportGif(tacticId, versions[0].id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tactic-animation.gif';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTacticMeta({ tags: [...tags, t] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTacticMeta({ tags: tags.filter(t => t !== tag) });
  };

  const handleToggleShare = async () => {
    if (!tacticId) return;
    const newPublic = !isPublic;
    try {
      await tacticApi.update(tacticId, { name, description, teamId, opponentTeamId, isPublic: newPublic, tags });
      setTacticMeta({ isPublic: newPublic });
    } catch (e) {
      console.error('Share toggle failed:', e);
    }
  };

  const copyShareLink = () => {
    if (uuid) {
      navigator.clipboard.writeText(`${window.location.origin}/shared/${uuid}`);
    }
  };

  const handleHomeTeamChange = async (id: string) => {
    if (!id) {
      setTacticMeta({ teamId: null });
      return;
    }
    try {
      const team = await teamApi.getById(Number(id));
      setHomeTeam(team);
    } catch (e) {
      console.error('Could not load home team:', e);
    }
  };

  const handleAwayTeamChange = async (id: string) => {
    if (!id) {
      setTacticMeta({ opponentTeamId: null });
      return;
    }
    try {
      const team = await teamApi.getById(Number(id));
      setAwayTeam(team);
    } catch (e) {
      console.error('Could not load away team:', e);
    }
  };

  return (
    <div className="bg-[#1e293b] rounded-xl p-5 flex flex-col gap-5 w-[300px] h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-[#4ade80]">Taktik Details</h2>

      {/* Name */}
      <div>
        <label className="block text-xs text-[#94a3b8] mb-1">Name</label>
        <input
          value={name}
          onChange={e => setTacticMeta({ name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-white text-sm focus:border-[#4ade80] focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-[#94a3b8] mb-1">Beschreibung</label>
        <textarea
          value={description}
          onChange={e => setTacticMeta({ description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-white text-sm focus:border-[#4ade80] focus:outline-none resize-none"
        />
      </div>

      {/* Home team picker */}
      <div>
        <label className="block text-xs text-[#94a3b8] mb-1 flex items-center gap-1">
          <Users size={12} /> Eigene Mannschaft
        </label>
        <select
          value={teamId ?? ''}
          onChange={e => handleHomeTeamChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-white text-sm focus:border-[#4ade80] focus:outline-none"
        >
          <option value="">— Default —</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Away team picker */}
      <div>
        <label className="block text-xs text-[#94a3b8] mb-1 flex items-center gap-1">
          <Shield size={12} /> Gegner
        </label>
        <select
          value={opponentTeamId ?? ''}
          onChange={e => handleAwayTeamChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-white text-sm focus:border-[#4ade80] focus:outline-none"
        >
          <option value="">— Default —</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs text-[#94a3b8] mb-1 flex items-center gap-1">
          <Tag size={12} /> Tags
        </label>
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-[#334155] text-[#94a3b8] text-xs px-2 py-1 rounded-full">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Tag hinzufügen..."
            className="flex-1 px-2 py-1 rounded-lg bg-[#0f172a] border border-[#334155] text-white text-xs focus:border-[#4ade80] focus:outline-none"
          />
          <button onClick={addTag} className="px-2 py-1 rounded-lg bg-[#334155] text-xs text-[#94a3b8] hover:bg-[#475569]">+</button>
        </div>
      </div>

      {/* Share Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-[#94a3b8] flex items-center gap-1">
          <Share2 size={14} /> Öffentlich teilen
        </label>
        <button
          onClick={handleToggleShare}
          disabled={!tacticId}
          className={`w-10 h-5 rounded-full transition-colors relative ${isPublic ? 'bg-[#4ade80]' : 'bg-[#334155]'} ${!tacticId ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {!tacticId && (
        <p className="text-xs text-[#64748b]">Bitte zuerst speichern, um zu teilen.</p>
      )}
      {isPublic && uuid && (
        <button onClick={copyShareLink} className="text-xs text-[#4ade80] hover:underline text-left">
          Share-Link kopieren
        </button>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#4ade80] text-[#0f172a] font-semibold text-sm hover:bg-[#22c55e] transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {saving ? 'Speichern...' : 'Speichern'}
        </button>
        {tacticId && (
          <button
            onClick={handleExportGif}
            disabled={exporting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#334155] text-white text-sm hover:bg-[#475569] transition-colors disabled:opacity-50"
          >
            <Download size={16} /> {exporting ? 'Exportiere...' : 'GIF Export'}
          </button>
        )}
      </div>
    </div>
  );
}
