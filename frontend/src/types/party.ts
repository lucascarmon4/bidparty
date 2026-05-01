export type PartyStatus = 'upcoming' | 'live' | 'ended';

export interface Party {
  id: string;
  title: string;
  category: string;
  scheduledAt: string;
  status: PartyStatus;
  maxParticipants: number;
  coverImage: string | null;
  host: { id: string; username: string; avatarUrl: string | null };
  _count: { registrations: number; items: number };
  isRegistered: boolean;
}
