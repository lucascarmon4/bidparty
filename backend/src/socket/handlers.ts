import type { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export function registerSocketHandlers(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        socket.data.userId = payload.userId;
      } catch {
        // allow unauthenticated connections
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id} user: ${socket.data.userId ?? 'guest'}`);
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }

    socket.on('join_lobby', async ({ partyId }: { partyId: string }) => {
      await socket.join(partyId);
      try {
        const party = await prisma.party.findUnique({
          where: { id: partyId },
          include: {
            items: { orderBy: { positionOrder: 'asc' } },
            registrations: {
              include: {
                user: { select: { id: true, username: true, avatarUrl: true, xp: true } },
              },
            },
          },
        });
        socket.emit('lobby_state', party);
      } catch {
        socket.emit('error', { message: 'Failed to load lobby' });
      }
    });

    socket.on('leave_lobby', ({ partyId }: { partyId: string }) => {
      socket.leave(partyId);
    });

    socket.on('send_chat_message', async ({ partyId, content }: { partyId: string; content: string }) => {
      if (!socket.data.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      try {
        const message = await prisma.chatMessage.create({
          data: { partyId, userId: socket.data.userId, content },
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        });
        io.to(partyId).emit('new_chat_message', {
          id: message.id,
          username: message.user.username,
          avatarUrl: message.user.avatarUrl,
          content: message.content,
          sentAt: message.sentAt,
        });
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('place_bid', async ({ itemId, amount }: { itemId: string; amount: number }) => {
      if (!socket.data.userId) {
        socket.emit('bid_error', { message: 'Not authenticated' });
        return;
      }
      const userId = socket.data.userId as string;
      try {
        const result = await prisma.$transaction(async (tx) => {
          const item = await tx.item.findUnique({ where: { id: itemId } });
          if (!item) throw new Error('Item not found');

          const highestBid = await tx.bid.findFirst({
            where: { itemId },
            orderBy: { amount: 'desc' },
            include: { user: { select: { id: true } } },
          });

          const floor = highestBid ? highestBid.amount : item.startingBid;
          if (amount <= floor) throw new Error(`Bid must be greater than $${floor}`);

          const bid = await tx.bid.create({
            data: { itemId, userId, amount },
            include: { user: { select: { id: true, username: true } } },
          });

          await tx.user.update({
            where: { id: userId },
            data: { xp: { increment: 10 } },
          });

          return { bid, partyId: item.partyId, previousBidderId: highestBid?.user?.id ?? null };
        });

        io.to(result.partyId).emit('bid_updated', {
          itemId,
          amount: result.bid.amount,
          userId: result.bid.user.id,
          username: result.bid.user.username,
        });

        socket.emit('xp_gained', { xp: 10 });

        if (result.previousBidderId && result.previousBidderId !== userId) {
          io.to(`user:${result.previousBidderId}`).emit('outbid_alert', {
            message: 'Você foi superado!',
            itemId,
            newAmount: amount,
          });
        }
      } catch (err: any) {
        socket.emit('bid_error', { message: err.message });
      }
    });

    socket.on('start_party', async ({ partyId }: { partyId: string }) => {
      if (!socket.data.userId) { socket.emit('error', { message: 'Not authenticated' }); return; }
      try {
        const party = await prisma.party.findUnique({ where: { id: partyId } });
        if (!party) { socket.emit('error', { message: 'Party not found' }); return; }
        if (party.hostUserId !== socket.data.userId) { socket.emit('error', { message: 'Only the host can start the party' }); return; }
        if (party.status !== 'upcoming') { socket.emit('error', { message: 'Party is not upcoming' }); return; }
        await prisma.party.update({ where: { id: partyId }, data: { status: 'live' } });
        io.to(partyId).emit('party_status_changed', { status: 'live' });
      } catch {
        socket.emit('error', { message: 'Failed to start party' });
      }
    });

    socket.on('end_party', async ({ partyId }: { partyId: string }) => {
      if (!socket.data.userId) { socket.emit('error', { message: 'Not authenticated' }); return; }
      try {
        const party = await prisma.party.findUnique({ where: { id: partyId } });
        if (!party) { socket.emit('error', { message: 'Party not found' }); return; }
        if (party.hostUserId !== socket.data.userId) { socket.emit('error', { message: 'Only the host can end the party' }); return; }
        if (party.status !== 'live') { socket.emit('error', { message: 'Party is not live' }); return; }
        await prisma.party.update({ where: { id: partyId }, data: { status: 'ended' } });
        io.to(partyId).emit('party_status_changed', { status: 'ended' });

        const items = await prisma.item.findMany({
          where: { partyId },
          include: {
            bids: {
              orderBy: { amount: 'desc' },
              take: 1,
              include: { user: { select: { id: true, username: true } } },
            },
          },
        });

        for (const item of items) {
          const topBid = item.bids[0];
          if (!topBid) continue;
          io.to(`user:${topBid.user.id}`).emit('item_won', {
            itemId: item.id,
            itemTitle: item.title,
            amount: topBid.amount,
          });
        }
      } catch {
        socket.emit('error', { message: 'Failed to end party' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`socket disconnected: ${socket.id}`);
    });
  });
}
