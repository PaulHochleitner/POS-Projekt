import { useNavigate } from 'react-router-dom';
import TacticLibrary from '../components/library/TacticLibrary';
import { Plus } from 'lucide-react';

export default function TacticLibraryPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Taktik-Bibliothek</h1>
        <button
          onClick={() => navigate('/tactics/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4ade80] text-[#0f172a] font-semibold text-sm hover:bg-[#22c55e] transition-colors"
        >
          <Plus size={18} /> Neue Taktik
        </button>
      </div>
      <TacticLibrary />
    </div>
  );
}
