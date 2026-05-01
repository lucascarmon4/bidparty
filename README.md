# BidParty

Real-time online auction platform with gamification. Built for Distributed Systems @ Unisantos 2026.

## Stack
- **Frontend:** React + TypeScript + TailwindCSS + Vite
- **Backend:** Node.js + Express + Socket.io + Prisma ORM
- **Database:** PostgreSQL
- **Cache/Broker:** Redis (Socket.io adapter)
- **Infra:** Docker Compose

## Running locally

```bash
docker compose up --build
```

On first run, apply the database migrations:

```bash
docker compose exec backend npx prisma migrate deploy
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Demo data

To reset the database and create a fresh demo party (requires a user account already created):

```bash
# with Docker running
docker compose exec backend npm run reset-demo

# or locally
cd backend && npm run reset-demo
```

The script deletes all parties, bids and chat messages, then creates a new party scheduled to start in 1 minute with the host user `carmon4`. Edit `STARTS_IN_MINUTES` and `HOST_USERNAME` in `backend/scripts/reset-demo.ts` to adjust.

## Team
- Felipe Barbosa dos Santos
- João Gabriel Henriques Cardoso
- Lucas Carmona Neto
- Lucas Cerqueira Galvão
