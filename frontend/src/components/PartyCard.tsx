import type { Party } from '../types/party.ts';
import StatusBadge from './StatusBadge.tsx';

interface Props {
  party: Party;
  featured?: boolean;
  isHost?: boolean;
  onJoin?: () => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=600&q=80';

export default function PartyCard({ party, featured = false, isHost = false, onJoin }: Props) {
  const pct = Math.round((party._count.registrations / party.maxParticipants) * 100);
  const avatarUrl = party.host.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${party.host.username}`;

  return (
    <div className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl overflow-hidden flex flex-col">
      <div className={`relative ${featured ? 'h-52' : 'h-40'} overflow-hidden`}>
        <img
          src={party.coverImage ?? FALLBACK_IMAGE}
          alt={party.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={party.status} />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-white font-bold text-base leading-tight">{party.title}</h3>
          <p className="text-purple-400 text-sm mt-1">{party.category}</p>
        </div>

        <div className="flex items-center gap-2">
          <img src={avatarUrl} alt={party.host.username} className="w-5 h-5 rounded-full bg-purple-800" />
          <span className="text-gray-400 text-sm">por {party.host.username}</span>
        </div>

        <div className="flex items-start justify-between text-sm text-gray-400 gap-2">
          <div className="flex items-start gap-1.5">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p>{formatDate(party.scheduledAt)}</p>
              <p className="text-xs text-gray-500">{formatTime(party.scheduledAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>{party._count.items} {party._count.items === 1 ? 'item' : 'itens'}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{party._count.registrations}/{party.maxParticipants} participantes</span>
            </div>
            <span className="text-gray-400">{pct}%</span>
          </div>
          <div className="h-1.5 bg-[#2a2b45] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-700 to-purple-400 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <button
          onClick={onJoin}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold rounded-lg transition-colors mt-auto cursor-pointer"
        >
          {party.status === 'ended'
            ? 'Ver Resultados'
            : party.status === 'live'
            ? 'Entrar Agora'
            : isHost
            ? 'Gerenciar Party'
            : party.isRegistered
            ? 'Acessar Lobby'
            : 'Inscrever-se'}
        </button>
      </div>
    </div>
  );
}
