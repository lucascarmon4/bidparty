import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { Party } from '../types/party.ts';
import Navbar from '../components/Navbar.tsx';
import FilterSidebar, { type Filters } from '../components/FilterSidebar.tsx';
import PartyCard from '../components/PartyCard.tsx';
import CreatePartyModal from '../components/CreatePartyModal.tsx';
import JoinPartyModal from '../components/JoinPartyModal.tsx';

export default function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinParty, setJoinParty] = useState<Party | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    statuses: [],
    maxPrice: 10000,
    dateRange: '',
  });

  const handleJoin = (p: Party) => {
    if (p.status === 'ended') { navigate(`/lobby/${p.id}`); return; }
    if (p.host.id === user?.id || p.isRegistered || p.status === 'live') {
      navigate(`/lobby/${p.id}`);
      return;
    }
    setJoinParty(p);
  };

  const loadParties = () => {
    fetch('/api/parties/categories')
      .then((r) => r.json())
      .then((data: string[]) => setAvailableCategories(data))
      .catch(console.error);

    setLoading(true);
    const token = localStorage.getItem('token');
    fetch('/api/parties', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((data: Party[]) => setParties(data))
      .catch((err) => { console.error('Failed to load parties', err); setParties([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadParties(); }, []);

  const filtered = parties.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(p.category)) return false;
    if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
    if (sortBy === 'ending') return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    return b.participantCount - a.participantCount;
  });

  const featured = sorted.filter((p) => p.status !== 'ended').slice(0, 2);
  const featuredIds = new Set(featured.map((p) => p.id));
  const grid = sorted.filter((p) => !featuredIds.has(p.id));

  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white">
      <Navbar onSearch={setSearch} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Descobrir Parties</h1>
            <p className="text-gray-400 mt-1 text-sm">Encontre e participe de leilões incríveis acontecendo agora</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar Party
          </button>
        </div>

        {(loading || featured.length > 0) && (
          <div className="mb-10">
            <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-white">
              <span>⭐</span> Parties em Destaque
            </h2>
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div key={i} className="h-96 bg-[#1a1b2e] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {featured.map((p) => (
                  <PartyCard key={p.id} party={p} featured isHost={p.host.id === user?.id} onJoin={() => handleJoin(p)} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-6">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            availableCategories={availableCategories}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">
                {loading ? 'Carregando...' : `${grid.length} ${grid.length === 1 ? 'party encontrada' : 'parties encontradas'}`}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1a1b2e] border border-[#2a2b45] text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="popular">Mais Popular</option>
                <option value="newest">Mais Recentes</option>
                <option value="ending">Encerrando em Breve</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-80 bg-[#1a1b2e] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : grid.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Nenhuma party encontrada.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grid.map((p) => (
                  <PartyCard key={p.id} party={p} isHost={p.host.id === user?.id} onJoin={() => handleJoin(p)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreatePartyModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadParties(); }}
        />
      )}

      {joinParty && (
        <JoinPartyModal
          party={joinParty}
          onClose={() => setJoinParty(null)}
        />
      )}
    </div>
  );
}
