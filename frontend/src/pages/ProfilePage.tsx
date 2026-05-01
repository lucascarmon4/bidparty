import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import Navbar from '../components/Navbar.tsx';

interface ProfileData {
  stats: { partiesJoined: number; totalBids: number; highestBid: number; auctionsWon: number };
  partyHistory: Array<{ id: string; partyName: string; date: string; status: string; itemsWon: number }>;
  recentBids: Array<{ id: string; item: string; party: string; amount: number; status: 'won' | 'outbid' | 'winning'; date: string }>;
  badges: Array<{ id: string; name: string; description: string; iconUrl: string | null }>;
}

function getLevel(xp: number) { return Math.floor(xp / 1000) + 1; }
function getTitle(level: number) {
  if (level <= 3) return 'Novato';
  if (level <= 7) return 'Licitante';
  if (level <= 12) return 'Veterano';
  return 'Mestre dos Lances';
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
function formatPartyStatus(status: string) {
  if (status === 'upcoming') return 'Agendada';
  if (status === 'live') return 'Ao Vivo';
  return 'Encerrada';
}
function bidStatusLabel(status: string) {
  if (status === 'won') return 'Venceu';
  if (status === 'winning') return 'Vencendo';
  return 'Superado';
}
function bidStatusColors(status: string) {
  if (status === 'won') return 'bg-green-900/60 text-green-400';
  if (status === 'winning') return 'bg-blue-900/60 text-blue-400';
  return 'bg-red-900/60 text-red-400';
}

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  const [activeTab, setActiveTab] = useState<'history' | 'bids'>('history');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const level = getLevel(user.xp);
  const xpInLevel = user.xp % 1000;
  const xpPct = (xpInLevel / 1000) * 100;
  const avatarUrl = user.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/users/me/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: ProfileData) => setProfile(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0e1a] text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-5">
        <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-purple-500 ring-offset-2 ring-offset-[#1a1b2e] shrink-0">
              <img src={avatarUrl} alt={user.username} className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <div className="flex items-center gap-4 mt-1.5">
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Membro desde {formatMemberSince(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white font-bold">Nível {level}</span>
                <span className="text-gray-500">—</span>
                <span className="text-yellow-400 font-medium">{getTitle(level)}</span>
              </div>
              <span className="text-gray-400 text-sm">
                {xpInLevel.toLocaleString('pt-BR')} / 1.000 XP
              </span>
            </div>
            <div className="h-2.5 bg-[#2a2b45] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-400 to-yellow-400 transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl p-6">
          <h2 className="flex items-center gap-2 font-bold text-white mb-4">
            <span>🏆</span> Conquistas
          </h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : !profile?.badges.length ? (
            <p className="text-gray-500 text-sm">Nenhuma conquista obtida ainda. Comece a participar!</p>
          ) : (
            <div className="grid grid-cols-6 gap-3">
              {profile.badges.map((badge) => (
                <div key={badge.id} className="rounded-xl p-3 flex flex-col items-center text-center gap-2 bg-[#0d0e1a] border border-purple-500">
                  <span className="text-3xl leading-none">{badge.iconUrl ?? '🎖️'}</span>
                  <div>
                    <p className="text-xs font-bold leading-tight text-white">{badge.name}</p>
                    <p className="text-xs mt-0.5 leading-tight text-gray-400">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            {
              icon: (
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              ),
              value: profile?.stats.partiesJoined ?? '—',
              label: 'Parties Participadas',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                  <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
                  <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
                </svg>
              ),
              value: profile?.stats.auctionsWon ?? '—',
              label: 'Leilões Vencidos',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
              value: profile?.stats.totalBids ?? '—',
              label: 'Total de Lances',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              value: profile ? `R$ ${profile.stats.highestBid.toLocaleString('pt-BR')}` : '—',
              label: 'Lance Mais Alto',
            },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl p-4">
              <div className="mb-3">{stat.icon}</div>
              <p className="text-2xl font-bold text-white">{loading ? '...' : stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'history' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Histórico de Parties
            </button>
            <button
              onClick={() => setActiveTab('bids')}
              className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === 'bids' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Lances Recentes
            </button>
          </div>

          {activeTab === 'history' && (
            loading ? (
              <p className="text-gray-500 text-sm px-6 py-4">Carregando...</p>
            ) : !profile?.partyHistory.length ? (
              <p className="text-gray-500 text-sm px-6 py-4">Nenhuma party participada ainda.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2b45]">
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Nome da Party</th>
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Data</th>
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Situação</th>
                    <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Itens Ganhos</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.partyHistory.map((row) => (
                    <tr key={row.id} className="border-b border-[#2a2b45] last:border-0 hover:bg-[#1f2040] transition-colors">
                      <td className="px-6 py-4 text-white text-sm">{row.partyName}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(row.date)}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-400">{formatPartyStatus(row.status)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-medium ${row.itemsWon > 0 ? 'text-teal-400' : 'text-gray-500'}`}>
                          {row.itemsWon}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'bids' && (
            loading ? (
              <p className="text-gray-500 text-sm px-6 py-4">Carregando...</p>
            ) : !profile?.recentBids.length ? (
              <p className="text-gray-500 text-sm px-6 py-4">Nenhum lance realizado ainda.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2b45]">
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Item</th>
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Party</th>
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Valor</th>
                    <th className="text-left px-6 py-3 text-gray-400 text-sm font-medium">Situação</th>
                    <th className="text-right px-6 py-3 text-gray-400 text-sm font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recentBids.map((bid) => (
                    <tr key={bid.id} className="border-b border-[#2a2b45] last:border-0 hover:bg-[#1f2040] transition-colors">
                      <td className="px-6 py-4 text-white text-sm">{bid.item}</td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{bid.party}</td>
                      <td className="px-6 py-4 text-white text-sm font-medium">
                        R$ {bid.amount.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${bidStatusColors(bid.status)}`}>
                          {bidStatusLabel(bid.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400 text-sm">{formatDate(bid.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </main>
    </div>
  );
}
