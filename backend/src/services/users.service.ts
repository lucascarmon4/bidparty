import prisma from '../prisma.js';

export async function getUserProfile(userId: string) {
  const [partiesJoined, totalBids, highestBidRow] = await Promise.all([
    prisma.partyRegistration.count({ where: { userId } }),
    prisma.bid.count({ where: { userId } }),
    prisma.bid.findFirst({
      where: { userId },
      orderBy: { amount: 'desc' },
      select: { amount: true },
    }),
  ]);

  const wonRows = await prisma.$queryRaw<[{ count: number }]>`
    SELECT COUNT(DISTINCT i.id)::int AS count
    FROM items i
    INNER JOIN parties p ON p.id = i.party_id AND p.status = 'ended'
    WHERE (
      SELECT user_id FROM bids WHERE item_id = i.id ORDER BY amount DESC LIMIT 1
    ) = ${userId}
  `;
  const auctionsWon = wonRows[0]?.count ?? 0;

  const registrations = await prisma.partyRegistration.findMany({
    where: { userId },
    include: {
      party: { select: { id: true, title: true, scheduledAt: true, status: true } },
    },
    orderBy: { registeredAt: 'desc' },
    take: 10,
  });

  const wonPerPartyRows = await prisma.$queryRaw<Array<{ party_id: string; count: number }>>`
    SELECT i.party_id, COUNT(DISTINCT i.id)::int AS count
    FROM items i
    WHERE (
      SELECT user_id FROM bids WHERE item_id = i.id ORDER BY amount DESC LIMIT 1
    ) = ${userId}
    AND i.party_id IN (
      SELECT party_id FROM party_registrations WHERE user_id = ${userId}
    )
    GROUP BY i.party_id
  `;
  const wonPerParty = new Map(wonPerPartyRows.map((r) => [r.party_id, r.count]));

  type BidRow = {
    item_id: string;
    item_title: string;
    party_title: string;
    party_status: string;
    user_max_amount: number;
    last_placed_at: Date;
    top_bidder_id: string;
  };
  const bidRows = await prisma.$queryRaw<BidRow[]>`
    SELECT
      i.id            AS item_id,
      i.title         AS item_title,
      p.title         AS party_title,
      p.status        AS party_status,
      MAX(b.amount)   AS user_max_amount,
      MAX(b.placed_at) AS last_placed_at,
      (SELECT user_id FROM bids WHERE item_id = i.id ORDER BY amount DESC LIMIT 1) AS top_bidder_id
    FROM bids b
    INNER JOIN items i ON i.id = b.item_id
    INNER JOIN parties p ON p.id = i.party_id
    WHERE b.user_id = ${userId}
    GROUP BY i.id, i.title, p.title, p.status
    ORDER BY last_placed_at DESC
    LIMIT 10
  `;

  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });

  return {
    stats: {
      partiesJoined,
      totalBids,
      highestBid: highestBidRow?.amount ?? 0,
      auctionsWon,
    },
    partyHistory: registrations.map((r) => ({
      id: r.partyId,
      partyName: r.party.title,
      date: r.party.scheduledAt,
      status: r.party.status,
      itemsWon: wonPerParty.get(r.partyId) ?? 0,
    })),
    recentBids: bidRows.map((row) => {
      const userWon = row.top_bidder_id === userId;
      const ended = row.party_status === 'ended';
      return {
        id: row.item_id,
        item: row.item_title,
        party: row.party_title,
        amount: Number(row.user_max_amount),
        status: ended ? (userWon ? 'won' : 'outbid') : (userWon ? 'winning' : 'outbid'),
        date: row.last_placed_at,
      };
    }),
    badges: userBadges.map((ub) => ({
      id: ub.badgeId,
      name: ub.badge.name,
      description: ub.badge.description,
      iconUrl: ub.badge.iconUrl,
    })),
  };
}
