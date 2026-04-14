import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tacticApi } from '../../api/tacticApi';
import { useTacticStore } from '../../store/useTacticStore';
import PitchCanvas from '../pitch/PitchCanvas';
import KeyframeTimeline from '../timeline/KeyframeTimeline';
import PlaybackControls from '../timeline/PlaybackControls';
import type { Tactic, FrameData } from '../../types';
import { GitBranch, Tag } from 'lucide-react';

interface SharedViewProps {
  uuid: string;
}

export default function SharedView({ uuid }: SharedViewProps) {
  const navigate = useNavigate();
  const { loadFrames } = useTacticStore();
  const [tactic, setTactic] = useState<Tactic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tacticApi.getShared(uuid)
      .then(t => {
        setTactic(t);
        if (t.latestVersion?.frames) {
          loadFrames(JSON.parse(t.latestVersion.frames) as FrameData);
        }
      })
      .catch(() => setError('Taktik nicht gefunden oder nicht öffentlich'));
  }, [uuid, loadFrames]);

  const handleFork = async () => {
    const forked = await tacticApi.fork(uuid);
    navigate(`/tactics/${forked.id}`);
  };

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-[#ef4444] text-lg">{error}</p>
      </div>
    );
  }

  if (!tactic) {
    return <div className="text-center py-20 text-[#64748b]">Laden...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{tactic.name}</h1>
          {tactic.description && <p className="text-[#94a3b8] text-sm mt-1">{tactic.description}</p>}
          {tactic.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {tactic.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-[#334155] text-[#94a3b8] text-xs px-2 py-0.5 rounded-full">
                  <Tag size={10} />{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleFork}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4ade80] text-[#0f172a] font-semibold text-sm hover:bg-[#22c55e] transition-colors"
        >
          <GitBranch size={16} /> Fork
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <PitchCanvas readOnly />
        <KeyframeTimeline />
        <PlaybackControls />
      </div>
    </div>
  );
}
