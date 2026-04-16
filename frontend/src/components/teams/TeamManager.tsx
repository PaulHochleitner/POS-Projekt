import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { teamApi } from '../../api/teamApi';
import type { Team, Player, Position } from '../../types';
import { Plus, Trash2, Edit2, Check, X, Upload, Shield, Users, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];

const calcOverall = (p: Player) => {
  const stats = [p.pace, p.passing, p.shooting, p.defending, p.physical, p.dribbling].filter(s => s != null) as number[];
  return stats.length > 0 ? Math.round(stats.reduce((a, b) => a + b, 0) / stats.length) : null;
};

export default function TeamManager({ teamId }: { teamId?: number }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', primaryColor: '#4ade80', secondaryColor: '#020617' });
  const [playerForm, setPlayerForm] = useState({
    name: '', number: 1, position: 'CM' as Position,
    pace: 50, passing: 50, shooting: 50, defending: 50, physical: 50, dribbling: 50, imageUrl: null as string | null,
    notes: ''
  });
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPlayerId, setUploadPlayerId] = useState<number | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (teamId) {
      teamApi.getById(teamId).then(t => {
        setSelectedTeam(t);
        setForm({ name: t.name, primaryColor: t.primaryColor, secondaryColor: t.secondaryColor });
      });
    }
  }, [teamId]);

  const loadTeams = () => teamApi.getAll().then(setTeams).catch(() => {});

  const createTeam = async () => {
    if (!form.name.trim()) return;
    const created = await teamApi.create(form);
    setTeams([...teams, created]);
    setSelectedTeam(created);
    setForm({ name: '', primaryColor: '#4ade80', secondaryColor: '#020617' });
  };

  const updateTeam = async () => {
    if (!selectedTeam) return;
    const updated = await teamApi.update(selectedTeam.id, form);
    setTeams(teams.map(t => t.id === updated.id ? updated : t));
    setSelectedTeam(updated);
    setEditMode(false);
  };

  const deleteTeam = async (id: number) => {
    if (!confirm('Team wirklich löschen?')) return;
    await teamApi.delete(id);
    setTeams(teams.filter(t => t.id !== id));
    if (selectedTeam?.id === id) setSelectedTeam(null);
  };

  const addPlayer = async () => {
    if (!selectedTeam || !playerForm.name.trim()) return;
    await teamApi.createPlayer(selectedTeam.id, playerForm);
    const updated = await teamApi.getById(selectedTeam.id);
    setSelectedTeam(updated);
    setTeams(teams.map(t => t.id === updated.id ? updated : t));
    setAddingPlayer(false);
    setPlayerForm({ name: '', number: 1, position: 'CM', pace: 50, passing: 50, shooting: 50, defending: 50, physical: 50, dribbling: 50, imageUrl: null, notes: '' });
  };

  const saveEditingPlayer = async () => {
    if (!editingPlayer || !selectedTeam) return;
    await teamApi.updatePlayer(editingPlayer.id, {
      name: editingPlayer.name,
      number: editingPlayer.number,
      position: editingPlayer.position,
      pace: editingPlayer.pace,
      passing: editingPlayer.passing,
      shooting: editingPlayer.shooting,
      defending: editingPlayer.defending,
      physical: editingPlayer.physical,
      dribbling: editingPlayer.dribbling,
      imageUrl: editingPlayer.imageUrl,
      notes: editingPlayer.notes,
    });
    const updated = await teamApi.getById(selectedTeam.id);
    setSelectedTeam(updated);
    setTeams(teams.map(t => t.id === updated.id ? updated : t));
    setEditingPlayer(null);
  };

  const deletePlayer = async (playerId: number) => {
    await teamApi.deletePlayer(playerId);
    if (selectedTeam) {
      const updated = await teamApi.getById(selectedTeam.id);
      setSelectedTeam(updated);
      setTeams(teams.map(t => t.id === updated.id ? updated : t));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !uploadPlayerId || !selectedTeam) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { alert('Max. 2MB'); return; }
    try {
      await teamApi.uploadPlayerImage(uploadPlayerId, file);
      const updated = await teamApi.getById(selectedTeam.id);
      setSelectedTeam(updated);
      setTeams(teams.map(t => t.id === updated.id ? updated : t));
    } catch (err) {
      console.error('Upload failed:', err);
    }
    e.target.value = '';
    setUploadPlayerId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* Sidebar: Team Selection & Creation */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-4 space-y-6"
      >
        <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-slate-800/50 rounded-[32px] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Shield size={20} className="text-[#4ade80]" />
              Kader-Management
            </h3>
            <span className="text-[10px] font-black bg-slate-800 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-widest">
              {teams.length} Teams
            </span>
          </div>

          <div className="space-y-2 mb-8 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            {teams.map(team => (
              <motion.button
                key={team.id}
                whileHover={{ x: 4 }}
                onClick={() => { setSelectedTeam(team); setForm({ name: team.name, primaryColor: team.primaryColor, secondaryColor: team.secondaryColor }); }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border group",
                  selectedTeam?.id === team.id 
                    ? "bg-[#4ade80]/10 border-[#4ade80]/30 shadow-[0_10px_20px_rgba(74,222,128,0.05)]" 
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl shadow-inner flex items-center justify-center overflow-hidden" style={{ backgroundColor: team.primaryColor }}>
                    <Shield size={20} style={{ color: team.secondaryColor }} className="opacity-40" />
                  </div>
                  {selectedTeam?.id === team.id && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4ade80] rounded-full border-2 border-[#0f172a]"></div>
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className={cn("text-sm font-black transition-colors", selectedTeam?.id === team.id ? "text-[#4ade80]" : "text-white group-hover:text-[#4ade80]")}>
                    {team.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {team.players.length} Spieler im Kader
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-800/50 space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Neues Team Gründen</p>
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Team Name..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-bold focus:border-[#4ade80]/50 outline-none transition-all"
              />
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Heim</span>
                  <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-6 h-6 rounded-md bg-transparent cursor-pointer" />
                </div>
                <div className="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gast</span>
                  <input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="w-6 h-6 rounded-md bg-transparent cursor-pointer" />
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={selectedTeam && editMode ? updateTeam : createTeam}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#4ade80] text-[#020617] text-xs font-black uppercase tracking-widest shadow-lg shadow-[#4ade80]/10 hover:shadow-[#4ade80]/20 transition-all"
              >
                <Plus size={16} strokeWidth={3} /> 
                {selectedTeam && editMode ? 'Team Aktualisieren' : 'Team Registrieren'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Area: Player Table & Details */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-8"
      >
        {selectedTeam ? (
          <div className="bg-[#0f172a]/60 backdrop-blur-xl border border-slate-800/50 rounded-[32px] overflow-hidden shadow-2xl">
            {/* Team Header */}
            <div className="p-8 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-transparent">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-slate-800" style={{ backgroundColor: selectedTeam.primaryColor }}>
                  <Shield size={40} style={{ color: selectedTeam.secondaryColor }} className="opacity-40" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">{selectedTeam.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-black text-[#4ade80] uppercase tracking-widest">
                      <Users size={12} /> {selectedTeam.players.length} Spieler
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="flex items-center gap-1 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      <TrendingUp size={12} /> Pro Kader
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditMode(!editMode)} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => deleteTeam(selectedTeam.id)} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Players Table */}
            <div className="p-8 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-left">
                    <th className="pb-6 pl-2">Profil</th>
                    <th className="pb-6">#</th>
                    <th className="pb-6">Name</th>
                    <th className="pb-6">Pos</th>
                    <th className="pb-6 text-center">PAC</th>
                    <th className="pb-6 text-center">SHO</th>
                    <th className="pb-6 text-center">PAS</th>
                    <th className="pb-6 text-center">DRI</th>
                    <th className="pb-6 text-center">DEF</th>
                    <th className="pb-6 text-center">PHY</th>
                    <th className="pb-6 text-center">OVR</th>
                    <th className="pb-6"></th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {selectedTeam.players.map((p, idx) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-4 pl-2">
                        <button 
                          onClick={() => { setUploadPlayerId(p.id); fileInputRef.current?.click(); }} 
                          className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-[#4ade80]/30 transition-all"
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Upload size={14} className="text-slate-600 group-hover:text-[#4ade80]" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 font-mono text-sm text-slate-400">#{p.number}</td>
                      <td className="py-4 font-black text-white">{p.name}</td>
                      <td className="py-4">
                        <span className="text-[10px] font-black bg-slate-900 text-slate-500 px-2 py-1 rounded-lg border border-slate-800">
                          {p.position}
                        </span>
                      </td>
                      <td className="py-4 text-center font-bold text-slate-500">{p.pace || '-'}</td>
                      <td className="py-4 text-center font-bold text-slate-500">{p.shooting || '-'}</td>
                      <td className="py-4 text-center font-bold text-slate-500">{p.passing || '-'}</td>
                      <td className="py-4 text-center font-bold text-slate-500">{p.dribbling || '-'}</td>
                      <td className="py-4 text-center font-bold text-slate-500">{p.defending || '-'}</td>
                      <td className="py-4 text-center font-bold text-slate-500">{p.physical || '-'}</td>
                      <td className="py-4 text-center">
                        <span className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-[#4ade80]/10 text-[#4ade80] font-black text-sm border border-[#4ade80]/20">
                          {calcOverall(p) || '-'}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditingPlayer(p)} className="p-2 rounded-lg text-slate-700 hover:text-[#4ade80] hover:bg-[#4ade80]/10 transition-all opacity-0 group-hover:opacity-100" title={p.notes ? 'Notizen vorhanden' : 'Bearbeiten'}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deletePlayer(p.id)} className="p-2 rounded-lg text-slate-700 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Player Form */}
            <div className="p-8 bg-slate-900/30 border-t border-slate-800/50">
              <AnimatePresence mode="wait">
                {!addingPlayer ? (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setAddingPlayer(true)}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-800 text-slate-600 font-black text-xs uppercase tracking-[0.2em] hover:border-[#4ade80]/30 hover:text-[#4ade80] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Spieler zum Kader Hinzufügen
                  </motion.button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Neuer Spieler</h4>
                      <button onClick={() => setAddingPlayer(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</label>
                        <input value={playerForm.name} onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nummer</label>
                        <input type="number" value={playerForm.number} onChange={e => setPlayerForm({ ...playerForm, number: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Position</label>
                        <select value={playerForm.position} onChange={e => setPlayerForm({ ...playerForm, position: e.target.value as Position })} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none appearance-none">
                          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(stat => (
                        <div key={stat} className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.slice(0, 3).toUpperCase()}</label>
                          <input type="number" min={1} max={99} value={(playerForm as any)[stat]} onChange={e => setPlayerForm({ ...playerForm, [stat]: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none" />
                        </div>
                      ))}
                      <div className="col-span-2 md:col-span-4 lg:col-span-6 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notizen</label>
                        <textarea
                          value={playerForm.notes}
                          onChange={e => setPlayerForm({ ...playerForm, notes: e.target.value })}
                          rows={3}
                          placeholder="z. B. Schneller Rechtsfuß, starker Kopfball ..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-medium focus:border-[#4ade80]/50 outline-none resize-none"
                        />
                      </div>
                    </div>
                    <button onClick={addPlayer} className="w-full py-3.5 bg-[#4ade80] text-[#020617] text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-[#22c55e] transition-all">
                      Spieler Verpflichten
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-[32px] space-y-6">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-slate-700">
              <Shield size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white tracking-tight">Kein Team Ausgewählt</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">Wähle ein Team aus der Liste oder gründe ein neues, um deinen Kader zu verwalten.</p>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editingPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
            onClick={() => setEditingPlayer(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-black text-white uppercase tracking-tight">Spieler Bearbeiten</h4>
                <button onClick={() => setEditingPlayer(null)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</label>
                  <input value={editingPlayer.name} onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nummer</label>
                  <input type="number" value={editingPlayer.number} onChange={e => setEditingPlayer({ ...editingPlayer, number: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Position</label>
                  <select value={editingPlayer.position} onChange={e => setEditingPlayer({ ...editingPlayer, position: e.target.value as Position })} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none appearance-none">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {(['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const).map(stat => (
                  <div key={stat} className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.slice(0, 3).toUpperCase()}</label>
                    <input type="number" min={1} max={99} value={editingPlayer[stat] ?? 50} onChange={e => setEditingPlayer({ ...editingPlayer, [stat]: +e.target.value })} className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-[#4ade80]/50 outline-none" />
                  </div>
                ))}
                <div className="col-span-2 md:col-span-4 lg:col-span-6 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notizen</label>
                  <textarea
                    value={editingPlayer.notes ?? ''}
                    onChange={e => setEditingPlayer({ ...editingPlayer, notes: e.target.value })}
                    rows={4}
                    placeholder="z. B. Schneller Rechtsfuß, starker Kopfball ..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-medium focus:border-[#4ade80]/50 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingPlayer(null)} className="flex-1 py-3.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all">
                  Abbrechen
                </button>
                <button onClick={saveEditingPlayer} className="flex-1 py-3.5 bg-[#4ade80] text-[#020617] text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-[#22c55e] transition-all flex items-center justify-center gap-2">
                  <Check size={14} strokeWidth={3} /> Speichern
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
