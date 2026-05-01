import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const HOST_USERNAME = 'carmon4';
const STARTS_IN_MINUTES = 1;

const PARTY = {
  title: 'BidParty Demo — Sistemas Distribuídos',
  category: 'Eletrônicos',
  coverImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
  maxParticipants: 50,
};

const ITEMS = [
  {
    title: 'MacBook Pro M3 Max',
    description: 'Notebook Apple com chip M3 Max, 36GB RAM, 1TB SSD.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    startingBid: 12000,
    positionOrder: 1,
  },
  {
    title: 'iPhone 16 Pro Max',
    description: 'Smartphone Apple 256GB, Titânio Natural.',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
    startingBid: 7500,
    positionOrder: 2,
  },
  {
    title: 'Sony WH-1000XM5',
    description: 'Headphone com cancelamento de ruído líder de mercado.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    startingBid: 1200,
    positionOrder: 3,
  },
  {
    title: 'PlayStation 5 Slim',
    description: 'Console Sony PS5 Slim com 2 controles DualSense.',
    imageUrl: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80',
    startingBid: 3500,
    positionOrder: 4,
  },
];

async function main() {
  console.log('🧹  Limpando dados de parties...');

  // Ordem importa por causa das foreign keys
  await prisma.bid.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.partyRegistration.deleteMany();
  await prisma.item.deleteMany();
  await prisma.party.deleteMany();

  console.log('✅  Dados limpos.\n');

  const host = await prisma.user.findUnique({ where: { username: HOST_USERNAME } });
  if (!host) {
    console.error(`❌  Usuário "${HOST_USERNAME}" não encontrado. Rode o app e crie a conta primeiro.`);
    process.exit(1);
  }

  console.log(`👤  Host: ${host.username} (${host.id})`);

  const scheduledAt = new Date(Date.now() + STARTS_IN_MINUTES * 60 * 1000);

  const party = await prisma.party.create({
    data: {
      title: PARTY.title,
      category: PARTY.category,
      coverImage: PARTY.coverImage,
      maxParticipants: PARTY.maxParticipants,
      hostUserId: host.id,
      scheduledAt,
      status: 'upcoming',
      items: {
        create: ITEMS,
      },
    },
    include: { items: true },
  });

  console.log(`🎉  Party criada: "${party.title}"`);
  console.log(`📅  Agendada para: ${scheduledAt.toLocaleString('pt-BR')}`);
  console.log(`📦  Itens criados: ${party.items.length}`);

  await prisma.partyRegistration.create({
    data: { userId: host.id, partyId: party.id },
  });

  console.log(`\n🔗  Party ID: ${party.id}`);
  console.log(`🌐  URL: http://localhost:3000/lobby/${party.id}`);
  console.log('\n✨  Demo pronta!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
