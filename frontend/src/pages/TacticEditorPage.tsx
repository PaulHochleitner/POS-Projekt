import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-h-0"
        >
          <PitchCanvas />
        </motion.div>
        
        <div className="space-y-6">
          <KeyframeTimeline />
          <PlaybackControls />
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-shrink-0"
      >
        <TacticSidebar />
      </motion.div>
    </div>
  );
}
