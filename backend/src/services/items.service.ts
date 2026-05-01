import prisma from '../prisma.js';

export async function addItem(
  partyId: string,
  hostUserId: string,
  data: { title: string; description?: string; imageUrl?: string; startingBid: number },
) {
  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) throw new Error('Party não encontrada');
  if (party.hostUserId !== hostUserId) throw new Error('Apenas o host pode adicionar itens');
  if (party.status === 'ended') throw new Error('A party já foi encerrada');

  const count = await prisma.item.count({ where: { partyId } });
  return prisma.item.create({
    data: {
      partyId,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      startingBid: data.startingBid,
      positionOrder: count + 1,
    },
  });
}

export async function deleteItem(itemId: string, hostUserId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId }, include: { party: true } });
  if (!item) throw new Error('Item não encontrado');
  if (item.party.hostUserId !== hostUserId) throw new Error('Apenas o host pode remover itens');
  await prisma.item.delete({ where: { id: itemId } });
}
