import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { tacticApi } from '../api/tacticApi';
import PitchCanvas from '../components/pitch/PitchCanvas';
import PlaybackControls from '../components/timeline/PlaybackControls';
import { useTacticStore } from '../store/useTacticStore';
import type { TacticVersion, FrameData, Frame } from '../types';

export default function VersionComparePage() {
  const { id } = useParams();
  const [versions, setVersions] = useState<TacticVersion[]>([]);
  const [leftId, setLeftId] = useState<number | null>(null);
  const [rightId, setRightId] = useState<number | null>(null);
  const [leftFrames, setLeftFrames] = useState<Frame[]>([]);
  const [rightFrames, setRightFrames] = useState<Frame[]>([]);
  const { loadFrames } = useTacticStore();

  useEffect(() => {
    if (!id) return;
    tacticApi.getVersions(Number(id)).then(v => {
      setVersions(v);
      if (v.length >= 2) {
        setLeftId(v[1].id);
        setRightId(v[0].id);
      }
    });
  }, [id]);

  useEffect(() => {
    if (leftId && id) {
      tacticApi.getVersion(Number(id), leftId).then(v => {
        if (v.frames) {
          const data: FrameData = JSON.parse(v.frames);
          setLeftFrames(data.frames);
          loadFrames(data);
        }
      });
    }
  }, [leftId, id]);

  useEffect(() => {
    if (rightId && id) {
      tacticApi.getVersion(Number(id), rightId).then(v => {
        if (v.frames) {
          const data: FrameData = JSON.parse(v.frames);
          setRightFrames(data.frames);
        }
      });
    }
  }, [rightId, id]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Versionsvergleich</h1>

      <div className="flex gap-4 mb-4">
        <select
          value={leftId ?? ''}
          onChange={e => setLeftId(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-[#1e293b] border border-[#334155] text-white text-sm"
        >
          <option value="">Version wählen...</option>
          {versions.map(v => (
            <option key={v.id} value={v.id}>V{v.versionNumber} - {v.label ?? 'Ohne Label'}</option>
          ))}
        </select>
        <span className="text-[#64748b] self-center">vs</span>
        <select
          value={rightId ?? ''}
          onChange={e => setRightId(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-[#1e293b] border border-[#334155] text-white text-sm"
        >
          <option value="">Version wählen...</option>
          {versions.map(v => (
            <option key={v.id} value={v.id}>V{v.versionNumber} - {v.label ?? 'Ohne Label'}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium text-[#94a3b8] mb-2">Version {versions.find(v => v.id === leftId)?.versionNumber ?? '?'}</h3>
          <PitchCanvas width={600} height={390} readOnly overrideFrame={leftFrames[0]} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#94a3b8] mb-2">Version {versions.find(v => v.id === rightId)?.versionNumber ?? '?'}</h3>
          <PitchCanvas width={600} height={390} readOnly overrideFrame={rightFrames[0]} />
        </div>
      </div>

      <PlaybackControls />
    </div>
  );
}
