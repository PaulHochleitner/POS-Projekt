import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTacticStore } from '../store/useTacticStore';
import { tacticApi } from '../api/tacticApi';
import { teamApi } from '../api/teamApi';
import PitchCanvas from '../components/pitch/PitchCanvas';
import KeyframeTimeline from '../components/timeline/KeyframeTimeline';
import PlaybackControls from '../components/timeline/PlaybackControls';
import TacticSidebar from '../components/sidebar/TacticSidebar';
import type { FrameData } from '../types';

export default function TacticEditorPage() {
  const { id } = useParams();
  const { setTacticMeta, loadFrames, reset, setHomeTeam, setAwayTeam } = useTacticStore();

  useEffect(() => {
    if (id && id !== 'new') {
      tacticApi.getById(Number(id)).then(async tactic => {
        setTacticMeta({
          tacticId: tactic.id,
          name: tactic.name,
          description: tactic.description ?? '',
          teamId: tactic.teamId,
          opponentTeamId: tactic.opponentTeamId,
          isPublic: tactic.isPublic,
          tags: tactic.tags,
          uuid: tactic.uuid,
        });
        if (tactic.latestVersion?.frames) {
          const data: FrameData = JSON.parse(tactic.latestVersion.frames);
          loadFrames(data);
        }
        // Pull team data so colors + roster refresh on the canvas
        if (tactic.teamId) {
          try { setHomeTeam(await teamApi.getById(tactic.teamId)); } catch { /* noop */ }
        }
        if (tactic.opponentTeamId) {
          try { setAwayTeam(await teamApi.getById(tactic.opponentTeamId)); } catch { /* noop */ }
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
