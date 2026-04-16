import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTacticStore } from '../../store/useTacticStore';
import { tacticApi } from '../../api/tacticApi';
import { teamApi } from '../../api/teamApi';
import type { Team } from '../../types';
import { Save, Download, Tag, X, Users, Info } from 'lucide-react';

export default function TacticSidebar() {
  const {
    tacticId, name, description, tags,
    teamId, opponentTeamId,
    setTacticMeta, getFrameData, setHomeTeam, setAwayTeam,
    clearHomeTeam, clearAwayTeam,
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
        await tacticApi.update(tacticId, { name, description, teamId, opponentTeamId, tags });
        await tacticApi.createVersion(tacticId, { frames: framesJson });
      } else {
        const created = await tacticApi.create({ name, description, teamId, opponentTeamId, tags, frames: framesJson });
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
      alert('Für ein animiertes GIF müssen mindestens 2 Keyframes vorhanden sein.');
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
      a.download = `${name.replace(/\s+/g, '-').toLowerCase()}-tactic.gif`;
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

  const handleHomeTeamChange = async (id: string) => {
    if (!id) { clearHomeTeam(); return; }
    try {
      const team = await teamApi.getById(Number(id));
      setHomeTeam(team);
    } catch (e) {
      console.error('Could not load home team:', e);
    }
  };

  const handleAwayTeamChange = async (id: string) => {
    if (!id) { clearAwayTeam(); return; }
    try {
      const team = await teamApi.getById(Number(id));
      setAwayTeam(team);
    } catch (e) {
      console.error('Could not load away team:', e);
    }
  };

  return (
    <motion.aside 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="bg-[#0f172a] border-l border-slate-800/50 p-6 flex flex-col gap-8 w-[340px] h-full overflow-y-auto z-10"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <Info size={20} className="text-[#4ade80]" />
          Konfiguration
        </h2>
        <div className="text-[10px] font-black bg-[#4ade80]/10 text-[#4ade80] px-2 py-0.5 rounded-full uppercase tracking-widest">
          {tacticId ? 'Edit-Mode' : 'New'}
        </div>
      </div>

      <div className="space-y-6">
        {/* Name & Description Section */}
        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Taktik Name</label>
            <input
              value={name}
              onChange={e => setTacticMeta({ name: e.target.value })}
              placeholder="z.B. 4-3-3 Gegenpressing"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-white text-sm font-bold focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/20 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setTacticMeta({ description: e.target.value })}
              rows={3}
              placeholder="Beschreibe deine taktische Vision..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-white text-sm font-medium focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/20 transition-all outline-none resize-none leading-relaxed"
            />
          </div>
        </section>

        {/* Teams Section */}
        <section className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/50 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Users size={12} /> Mannschaften
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Eigene Elf</label>
              <select
                value={teamId ?? ''}
                onChange={e => handleHomeTeamChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none appearance-none"
              >
                <option value="">— Standard —</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Gegner</label>
              <select
                value={opponentTeamId ?? ''}
                onChange={e => handleAwayTeamChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none appearance-none"
              >
                <option value="">— Standard —</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Tags Section */}
        <section className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Tag size={12} /> Tags & Kategorien
          </label>
          <div className="flex flex-wrap gap-1.5 min-h-[28px]">
            <AnimatePresence>
              {tags.map(tag => (
                <motion.span 
                  key={tag}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1.5 bg-[#4ade80]/10 text-[#4ade80] text-[10px] font-black px-2.5 py-1 rounded-lg border border-[#4ade80]/20"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X size={10} /></button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
              placeholder="Tag hinzufügen..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800/50 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none"
            />
            <button 
              onClick={addTag} 
              className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-[#4ade80] hover:bg-slate-700 transition-colors shadow-lg"
            >
              +
            </button>
          </div>
        </section>

      </div>

      {/* Primary Actions */}
      <div className="mt-auto space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#4ade80] text-[#020617] font-black text-sm shadow-lg shadow-[#4ade80]/10 hover:shadow-[#4ade80]/20 transition-all disabled:opacity-50"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />
          ) : (
            <Save size={18} strokeWidth={3} />
          )}
          <span>{saving ? 'SICHERN...' : 'TAKTIK SPEICHERN'}</span>
        </motion.button>

        {tacticId && (
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportGif}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-white font-black text-sm transition-all disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={18} strokeWidth={3} className="text-[#4ade80]" />
            )}
            <span>{exporting ? 'EXPORTIERE...' : 'GIF EXPORT'}</span>
          </motion.button>
        )}
      </div>
    </motion.aside>
  );
}
