import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTacticStore } from '../store/useTacticStore';
import { tacticApi } from '../api/tacticApi';
import PitchCanvas from '../components/pitch/PitchCanvas';
import KeyframeTimeline from '../components/timeline/KeyframeTimeline';
import PlaybackControls from '../components/timeline/PlaybackControls';
import TacticSidebar from '../components/sidebar/TacticSidebar';
import type { FrameData } from '../types';

export default function TacticEditorPage() {
  const { id } = useParams();
  const { setTacticMeta, loadFrames, reset } = useTacticStore();

  useEffect(() => {
    if (id && id !== 'new') {
      tacticApi.getById(Number(id)).then(tactic => {
        setTacticMeta({
          tacticId: tactic.id,
          name: tactic.name,
          description: tactic.description ?? '',
          teamId: tactic.teamId,
          isPublic: tactic.isPublic,
          tags: tactic.tags,
          uuid: tactic.uuid,
        });
        if (tactic.latestVersion?.frames) {
          const data: FrameData = JSON.parse(tactic.latestVersion.frames);
          loadFrames(data);
        }
      });
    } else {
      reset();
    }
  }, [id]);

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col gap-4">
        <PitchCanvas />
        <KeyframeTimeline />
        <PlaybackControls />
      </div>
      <TacticSidebar />
    </div>
  );
}
