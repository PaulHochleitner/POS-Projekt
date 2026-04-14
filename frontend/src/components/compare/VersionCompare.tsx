import { useState, useEffect } from 'react';
import { tacticApi } from '../../api/tacticApi';
import PitchCanvas from '../pitch/PitchCanvas';
import type { TacticVersion, FrameData, Frame } from '../../types';

interface VersionCompareProps {
  tacticId: number;
}

export default function VersionCompare({ tacticId }: VersionCompareProps) {
  const [versions, setVersions] = useState<TacticVersion[]>([]);
  const [leftId, setLeftId] = useState<number | null>(null);
  const [rightId, setRightId] = useState<number | null>(null);
  const [leftFrame, setLeftFrame] = useState<Frame | undefined>();
  const [rightFrame, setRightFrame] = useState<Frame | undefined>();

  useEffect(() => {
    tacticApi.getVersions(tacticId).then(v => {
      setVersions(v);
      if (v.length >= 2) {
        setLeftId(v[1].id);
        setRightId(v[0].id);
      }
    });
  }, [tacticId]);

  useEffect(() => {
    if (leftId) {
      tacticApi.getVersion(tacticId, leftId).then(v => {
        if (v.frames) {
          const data: FrameData = JSON.parse(v.frames);
          setLeftFrame(data.frames[0]);
        }
      });
    }
  }, [leftId, tacticId]);

  useEffect(() => {
    if (rightId) {
      tacticApi.getVersion(tacticId, rightId).then(v => {
        if (v.frames) {
          const data: FrameData = JSON.parse(v.frames);
          setRightFrame(data.frames[0]);
        }
      });
    }
  }, [rightId, tacticId]);

  return (
    <div>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-[#94a3b8] mb-2">
            Version {versions.find(v => v.id === leftId)?.versionNumber ?? '?'}
          </h3>
          <PitchCanvas width={580} height={377} readOnly overrideFrame={leftFrame} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#94a3b8] mb-2">
            Version {versions.find(v => v.id === rightId)?.versionNumber ?? '?'}
          </h3>
          <PitchCanvas width={580} height={377} readOnly overrideFrame={rightFrame} />
        </div>
      </div>
    </div>
  );
}
