# BidParty — Claude Code Context Prompt

## Project Overview

**BidParty** is a real-time online auction platform with gamification elements, developed as a Distributed Systems university project at Universidade Católica de Santos (Unisantos), Computer Science program, 2026.

The platform allows users to join scheduled auction sessions called **Parties**, place live bids on items, interact via a warm-up chat lobby before the auction starts, and earn XP, badges, and ranking positions through a gamification system. The core technical challenge is handling concurrent bids, real-time synchronization, and consistency across multiple connected users — which are the central distributed systems concepts the project must demonstrate.

The visual reference for the UI is a dark, modern auction platform called **BidParty** (Figma mockup already defined), featuring a card-based discovery page for Parties, a lobby screen with countdown, warm-up chat, participant list and upcoming items, and a live bidding interface.

---

## Monorepo Structure

```
bidparty/
├── frontend/         # React + TypeScript + TailwindCSS
├── backend/          # Node.js + Express + Socket.io
├── docker-compose.yml
├── .gitignore
├── README.md
└── CLAUDE.md         # This file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, TailwindCSS |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL |
| Cache / Message Broker | Redis (Socket.io adapter only) |
| Containerization | Docker + Docker Compose |

> **Note on Redis:** Redis is used exclusively as the Socket.io adapter to enable distributed event broadcasting. You do not need to write raw Redis commands — Socket.io handles the pub/sub internally. Its role is to satisfy the "message broker" requirement from the distributed systems spec.

---

## Core Features (from requirements doc)

### Identity & Access
- User registration and login (JWT-based authentication)
- User profiles with avatar, XP level, and badge display

### Parties (Auction Sessions)
- Create, schedule, and browse auction Parties
- Each Party has a category, date/time, item list, and participant cap
- Status: Upcoming / Live / Ended
- Users can register for upcoming Parties or join live ones

### Lobby (Warm-up)
- Pre-auction waiting room with countdown timer
- Warm-up chat visible to all registered participants
- Confirmed participants list with XP levels shown
- Preview of upcoming items with starting bids

### Live Bidding
- Real-time bid placement via WebSocket (Socket.io)
- Current highest bid always visible and updated instantly for all users
- Bid validation: must be higher than current highest bid
- Automatic auction close when time expires or no higher bid within window

### Chat
- Live chat during auction session
- Emoji reactions support
- Messages scoped to the Party room

### Gamification
- XP system: users earn XP for participating, winning bids, and engaging in chat
- Badges: awarded for milestones (first win, streak bidder, etc.)
- Real-time ranking leaderboard per Party and global

### Notifications
- In-app notifications for outbid events, Party start reminders, and auction results

### Reports & History
- Bid history per item
- User activity history (Parties joined, items won, XP earned)

---

## Non-Functional Requirements

- **Latency:** Bid updates must propagate to all clients in under 500ms
- **Consistency:** No two users should see conflicting highest bids; optimistic locking or atomic operations must be used on bid writes
- **Availability:** System should degrade gracefully — if a socket disconnects, the user can reconnect and resume
- **Scalability:** Architecture must support horizontal scaling of the Node.js backend (Redis adapter enables this)
- **Security:** JWT authentication on all protected routes; socket connections authenticated via token on handshake
- **Auditability:** All bids stored in PostgreSQL with timestamps and user IDs

---

## Database (PostgreSQL) — Key Entities

- `users` — id, username, email, password_hash, xp, avatar_url, created_at
- `parties` — id, title, category, host_user_id, scheduled_at, status, max_participants
- `party_registrations` — user_id, party_id, registered_at
- `items` — id, party_id, title, description, image_url, starting_bid, position_order
- `bids` — id, item_id, user_id, amount, placed_at
- `chat_messages` — id, party_id, user_id, content, sent_at
- `badges` — id, name, description, icon_url
- `user_badges` — user_id, badge_id, awarded_at

---

## Real-Time Architecture (Socket.io)

The backend uses Socket.io rooms mapped to Party IDs. When a user joins a Party lobby or live auction, they join the corresponding Socket.io room. Events flow as follows:

```
client emits  →  "place_bid"        { itemId, amount }
server validates bid (PostgreSQL atomic write)
server emits  →  "bid_updated"      { itemId, amount, userId, username }  → to room
server emits  →  "outbid_alert"     { message }                           → to previous highest bidder
server emits  →  "xp_gained"        { userId, xp }                        → to user

client emits  →  "chat_message"     { partyId, content }
server emits  →  "new_chat_message" { username, content, sentAt }         → to room
```

---

## Development Environment

All services are orchestrated with Docker Compose. Run `docker compose up --build` from the root to start:

- `frontend` on port **3000**
- `backend` on port **4000**
- `postgres` on port **5432**
- `redis` on port **6379**

---

## Implementation Order (Roadmap)

1. **Project scaffolding** — monorepo structure, Docker Compose, environment variables
2. **Database schema** — migrations for all core tables
3. **Auth** — register/login endpoints, JWT middleware, socket handshake auth
4. **Parties CRUD** — create, list, get, register for a Party
5. **Lobby** — join room via socket, warm-up chat, participant list
6. **Live bidding** — item auction flow, bid validation, real-time broadcast
7. **Gamification** — XP on events, badge triggers, ranking query
8. **Frontend** — pages: Home (Discover Parties), Lobby, Live Auction, Profile
9. **Notifications** — in-app alerts for outbid, Party start
10. **Polish & integration tests**

---

## UI Reference

The Figma mockup (dark theme, purple/violet accents, card-based layout) is the visual reference. Key screens:

- **Discover Parties** — grid of Party cards with status badges (Upcoming/Live), category, host, date, item count, participant progress bar, and Register/Join Now CTA
- **Lobby** — countdown timer, warm-up chat panel, confirmed participants list with XP badges, upcoming items preview
- **Live Auction** — current item with image and bid history, bid input, live chat, participant sidebar

Figma link: https://www.figma.com/make/EZVbSph2gjVfeyKMmymRZN/leil%C3%A3o

---

## Repository

- **GitHub:** https://github.com/lucascarmon4/bidparty
- **Branching:** `main` (stable) → `develop` (integration) → feature branches (`feat/auth`, `feat/lobby`, etc.)

---

## Important Notes for Claude Code

- Always use TypeScript on both frontend and backend
- Backend follows a layered architecture: `routes → controllers → services → repositories`
- Use `pg` (node-postgres) directly for database access — no ORM
- Socket.io events must be typed (use a shared `types/` or `events.ts` file referenced by both frontend and backend)
- Environment variables via `.env` files (never committed); use `.env.example` as template
- All bid writes must be atomic — use PostgreSQL transactions to prevent race conditions
- The project is academic; prioritize clarity and distributed systems concepts over production-level optimization
