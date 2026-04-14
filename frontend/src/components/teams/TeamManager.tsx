import { useState, useEffect, useRef } from 'react';
import { teamApi } from '../../api/teamApi';
import type { Team, Player, Position } from '../../types';
import { Plus, Trash2, Edit2, Check, X, Upload } from 'lucide-react';

const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];

const calcOverall = (p: Player) => {
  const stats = [p.pace, p.passing, p.shooting, p.defending, p.physical, p.dribbling].filter(s => s != null) as number[];
  return stats.length > 0 ? Math.round(stats.reduce((a, b) => a + b, 0) / stats.length) : null;
};

export default function TeamManager({ teamId }: { teamId?: number }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', primaryColor: '#1e3a5f', secondaryColor: '#ffffff' });
  const [playerForm, setPlayerForm] = useState({
    name: '', number: 1, position: 'CM' as Position,
    pace: 50, passing: 50, shooting: 50, defending: 50, physical: 50, dribbling: 50, imageUrl: null as string | null
  });
  const [addingPlayer, setAddingPlayer] = useState(false);
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
    const created = await teamApi.create(form);
    setTeams([...teams, created]);
    setSelectedTeam(created);
    setForm({ name: '', primaryColor: '#1e3a5f', secondaryColor: '#ffffff' });
  };

  const updateTeam = async () => {
    if (!selectedTeam) return;
    const updated = await teamApi.update(selectedTeam.id, form);
    setTeams(teams.map(t => t.id === updated.id ? updated : t));
    setSelectedTeam(updated);
    setEditMode(false);
  };

  const deleteTeam = async (id: number) => {
    await teamApi.delete(id);
    setTeams(teams.filter(t => t.id !== id));
    if (selectedTeam?.id === id) setSelectedTeam(null);
  };

  const addPlayer = async () => {
    if (!selectedTeam) return;
    await teamApi.createPlayer(selectedTeam.id, playerForm);
    const updated = await teamApi.getById(selectedTeam.id);
    setSelectedTeam(updated);
    setTeams(teams.map(t => t.id === updated.id ? updated : t));
    setAddingPlayer(false);
    setPlayerForm({ name: '', number: 1, position: 'CM', pace: 50, passing: 50, shooting: 50, defending: 50, physical: 50, dribbling: 50, imageUrl: null });
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
    if (file.size > 2 * 1024 * 1024) { alert('Maximale Dateigröße: 2MB'); return; }
    if (!['image/jpeg', 'image/png'].includes(file.type)) { alert('Nur JPG/PNG erlaubt'); return; }
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

  const triggerUpload = (playerId: number) => {
    setUploadPlayerId(playerId);
    fileInputRef.current?.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} />

      {/* Team List */}
      <div className="bg-[#1e293b] rounded-xl p-5">
        <h3 className="font-bold text-white mb-4">Teams</h3>
        <div className="flex flex-col gap-2 mb-4">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => { setSelectedTeam(team); setForm({ name: team.name, primaryColor: team.primaryColor, secondaryColor: team.secondaryColor }); }}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                selectedTeam?.id === team.id ? 'bg-[#334155] border border-[#4ade80]' : 'bg-[#0f172a] hover:bg-[#334155]'
              }`}
            >
              <div className="w-8 h-8 rounded-full" style={{ background: team.primaryColor, border: `2px solid ${team.secondaryColor}` }} />
              <span className="text-white text-sm flex-1">{team.name}</span>
              <span className="text-xs text-[#64748b]">{team.players.length} Spieler</span>
            </button>
          ))}
        </div>

        {/* Create team form */}
        <div className="border-t border-[#334155] pt-4 flex flex-col gap-2">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Teamname..."
            className="w-full px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-white text-sm focus:border-[#4ade80] focus:outline-none"
          />
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-xs text-[#94a3b8]">
              Primär
              <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            </label>
            <label className="flex items-center gap-1 text-xs text-[#94a3b8]">
              Sekundär
              <input type="color" value={form.secondaryColor} onChange={e => setForm({ ...form, secondaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            </label>
          </div>
          <button onClick={selectedTeam && editMode ? updateTeam : createTeam}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#4ade80] text-[#0f172a] text-sm font-semibold hover:bg-[#22c55e] transition-colors">
            <Plus size={16} /> {selectedTeam && editMode ? 'Aktualisieren' : 'Team erstellen'}
          </button>
        </div>
      </div>

      {/* Player List */}
      <div className="lg:col-span-2 bg-[#1e293b] rounded-xl p-5">
        {selectedTeam ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{selectedTeam.name} - Spieler</h3>
              <div className="flex gap-2">
                <button onClick={() => setEditMode(!editMode)} className="p-2 rounded-lg bg-[#334155] text-[#94a3b8] hover:bg-[#475569]">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deleteTeam(selectedTeam.id)} className="p-2 rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626]">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#64748b] text-left">
                    <th className="pb-2">Bild</th>
                    <th className="pb-2">#</th><th className="pb-2">Name</th><th className="pb-2">Pos</th>
                    <th className="pb-2">PAC</th><th className="pb-2">SHO</th><th className="pb-2">PAS</th>
                    <th className="pb-2">DRI</th><th className="pb-2">DEF</th><th className="pb-2">PHY</th>
                    <th className="pb-2">OVR</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTeam.players.map(p => (
                    <tr key={p.id} className="border-t border-[#334155]">
                      <td className="py-2">
                        <button onClick={() => triggerUpload(p.id)} className="w-8 h-8 rounded-full overflow-hidden bg-[#334155] hover:ring-2 hover:ring-[#4ade80] flex items-center justify-center" title="Bild hochladen">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Upload size={12} className="text-[#64748b]" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 text-white font-mono">{p.number}</td>
                      <td className="py-2 text-white">{p.name}</td>
                      <td className="py-2 text-[#94a3b8]">{p.position}</td>
                      <td className="py-2 text-[#94a3b8]">{p.pace ?? '-'}</td>
                      <td className="py-2 text-[#94a3b8]">{p.shooting ?? '-'}</td>
                      <td className="py-2 text-[#94a3b8]">{p.passing ?? '-'}</td>
                      <td className="py-2 text-[#94a3b8]">{p.dribbling ?? '-'}</td>
                      <td className="py-2 text-[#94a3b8]">{p.defending ?? '-'}</td>
                      <td className="py-2 text-[#94a3b8]">{p.physical ?? '-'}</td>
                      <td className="py-2 font-bold text-[#4ade80]">{calcOverall(p) ?? '-'}</td>
                      <td className="py-2">
                        <button onClick={() => deletePlayer(p.id)} className="text-[#ef4444] hover:text-[#dc2626]">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Player */}
            {addingPlayer ? (
              <div className="mt-4 p-3 bg-[#0f172a] rounded-lg flex flex-wrap gap-2 items-end">
                <div>
                  <label className="text-xs text-[#64748b]">Name</label>
                  <input value={playerForm.name} onChange={e => setPlayerForm({ ...playerForm, name: e.target.value })}
                    className="block w-32 px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748b]">#</label>
                  <input type="number" value={playerForm.number} onChange={e => setPlayerForm({ ...playerForm, number: +e.target.value })}
                    className="block w-16 px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748b]">Position</label>
                  <select value={playerForm.position} onChange={e => setPlayerForm({ ...playerForm, position: e.target.value as Position })}
                    className="block px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#64748b]">PAC</label>
                  <input type="number" min={1} max={99} value={playerForm.pace} onChange={e => setPlayerForm({ ...playerForm, pace: +e.target.value })}
                    className="block w-14 px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748b]">SHO</label>
                  <input type="number" min={1} max={99} value={playerForm.shooting} onChange={e => setPlayerForm({ ...playerForm, shooting: +e.target.value })}
                    className="block w-14 px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748b]">PAS</label>
                  <input type="number" min={1} max={99} value={playerForm.passing} onChange={e => setPlayerForm({ ...playerForm, passing: +e.target.value })}
                    className="block w-14 px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748b]">DRI</label>
                  <input type="number" min={1} max={99} value={playerForm.dribbling} onChange={e => setPlayerForm({ ...playerForm, dribbling: +e.target.value })}
                    className="block w-14 px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748b]">DEF</label>
                  <input type="number" min={1} max={99} value={playerForm.defending} onChange={e => setPlayerForm({ ...playerForm, defending: +e.target.value })}
                    className="block w-14 px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748b]">PHY</label>
                  <input type="number" min={1} max={99} value={playerForm.physical} onChange={e => setPlayerForm({ ...playerForm, physical: +e.target.value })}
                    className="block w-14 px-2 py-1 rounded bg-[#1e293b] border border-[#334155] text-white text-sm" />
                </div>
                <button onClick={addPlayer} className="p-1 rounded bg-[#4ade80] text-[#0f172a]"><Check size={16} /></button>
                <button onClick={() => setAddingPlayer(false)} className="p-1 rounded bg-[#334155] text-[#94a3b8]"><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => setAddingPlayer(true)}
                className="mt-4 flex items-center gap-1 text-sm text-[#4ade80] hover:text-[#22c55e]">
                <Plus size={16} /> Spieler hinzufügen
              </button>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-[#64748b]">Wähle ein Team aus</div>
        )}
      </div>
    </div>
  );
}
