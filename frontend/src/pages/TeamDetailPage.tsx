import { useParams } from 'react-router-dom';
import TeamManager from '../components/teams/TeamManager';

export default function TeamDetailPage() {
  const { id } = useParams();
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Team Details</h1>
      <TeamManager teamId={id ? Number(id) : undefined} />
    </div>
  );
}
