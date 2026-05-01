import prisma from '../prisma.js';
import type { PartyStatus } from '../../generated/prisma/client.js';

export async function listCategories(): Promise<string[]> {
  const rows = await prisma.party.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => r.category);
}

export async function listParties(filters?: { category?: string; status?: string }, userId?: string) {
  const parties = await prisma.party.findMany({
    where: {
      ...(filters?.category ? { category: filters.category } : {}),
      ...(filters?.status ? { status: filters.status as PartyStatus } : {}),
    },
    include: {
      host: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { registrations: true, items: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  if (!userId) return parties.map((p) => ({ ...p, isRegistered: false }));

  const registered = new Set(
    (await prisma.partyRegistration.findMany({
      where: { userId, partyId: { in: parties.map((p) => p.id) } },
      select: { partyId: true },
    })).map((r) => r.partyId),
  );

  return parties.map((p) => ({ ...p, isRegistered: registered.has(p.id) }));
}

export async function getParty(id: string) {
  const party = await prisma.party.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, username: true, avatarUrl: true } },
      items: {
        orderBy: { positionOrder: 'asc' },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
            include: { user: { select: { id: true, username: true } } },
          },
        },
      },
      registrations: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true, xp: true } },
        },
      },
    },
  });
  if (!party) throw new Error('Party not found');

  const recentBids = await prisma.bid.findMany({
    where: { item: { partyId: id } },
    orderBy: { placedAt: 'desc' },
    take: 100,
    include: {
      item: { select: { id: true, title: true } },
      user: { select: { username: true } },
    },
  });

  return { ...party, recentBids };
}

export async function createParty(
  hostUserId: string,
  data: {
    title: string;
    category: string;
    scheduledAt: string;
    maxParticipants: number;
    coverImage?: string;
  },
) {
  return prisma.party.create({
    data: { ...data, hostUserId, scheduledAt: new Date(data.scheduledAt) },
    include: { host: { select: { id: true, username: true, avatarUrl: true } } },
  });
}

export async function registerForParty(userId: string, partyId: string) {
  const party = await prisma.party.findUnique({
    where: { id: partyId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!party) throw new Error('Party not found');
  if (party.status !== 'upcoming') throw new Error('Party is not open for registration');
  if (party._count.registrations >= party.maxParticipants) throw new Error('Party is full');

  const existing = await prisma.partyRegistration.findUnique({
    where: { userId_partyId: { userId, partyId } },
  });
  if (existing) throw new Error('Already registered');

  return prisma.partyRegistration.create({ data: { userId, partyId } });
}
