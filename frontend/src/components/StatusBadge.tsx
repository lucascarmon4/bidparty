import type { PartyStatus } from '../types/party.ts';

const config: Record<PartyStatus, { label: string; className: string }> = {
  live: { label: 'Ao Vivo', className: 'bg-red-500 text-white' },
  upcoming: { label: 'Agendada', className: 'bg-purple-600 text-white' },
  ended: { label: 'Encerrada', className: 'bg-gray-500 text-white' },
};

export default function StatusBadge({ status }: { status: PartyStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
