# SHADE - Multiplayer Word Deduction Game

**SHADE** is a real-time multiplayer social deduction game inspired by **Spyfall** and **Among Us**. Players receive a secret word from a category — but one player (the **Imposter/Shade**) gets a different word. Through clues, discussion, and voting, citizens try to find the imposter while the imposter tries to blend in.

Built with **Next.js 14**, **Socket.io**, **MongoDB**, and **TypeScript**.

> **Language / Dil**: The game UI supports both **Azerbaijani** and **English**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Game Flow](#game-flow)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Socket Events](#socket-events)
- [Security](#security)
- [Contributing](#contributing)

---

## Features

### Core Gameplay
- Real-time multiplayer (3-10 players per room)
- Room-based matchmaking with unique room codes
- Category selection (food, animals, countries, professions, etc.)
- Multi-round gameplay with configurable round count
- Clue submission system — each player gives a one-word clue
- Discussion phase with real-time chat
- Anonymous voting to eliminate suspected imposters
- Role reveal and score calculation at game end

### Social Features
- Friend system (add, accept, reject, remove)
- Global leaderboard with XP-based ranking
- Game history and statistics tracking
- Player profiles with badges and achievements
- Emoji reactions during gameplay
- Spectator mode for eliminated players

### Technical Features
- Progressive Web App (PWA) — installable on mobile
- Dark / Light theme support
- Internationalization (Azerbaijani / English)
- Sound effects and background music (15 audio tracks)
- Animated card reveals (Framer Motion)
- Real-time reconnection support
- Guest mode (no registration required)
- Responsive design (mobile-first)

### Security
- JWT authentication with httpOnly cookies
- bcrypt password hashing
- Rate limiting on API routes and socket events
- Input sanitization (XSS, NoSQL injection prevention)
- CORS configuration with production lockdown
- Security headers (X-Frame-Options, CSP, etc.)
- Server-generated guest IDs (no client-side spoofing)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS 3.4, Framer Motion |
| **Real-time** | Socket.io 4.8 (client + server) |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas + Mongoose 9 |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Audio** | Howler.js |
| **PWA** | next-pwa (Workbox) |
| **Deployment** | Docker, Vercel (frontend), any Node.js host (socket) |

---

## Project Structure

```
shade/
├── app/                    # Next.js App Router pages
│   ├── api/                # 13 API route handlers
│   │   ├── auth/           # login, register, me
│   │   ├── categories/     # game categories
│   │   ├── friends/        # friend management
│   │   ├── leaderboard/    # rankings
│   │   ├── replays/        # game replays
│   │   ├── rooms/          # room CRUD + join
│   │   ├── tournaments/    # tournament data
│   │   ├── users/          # profiles + history
│   │   └── words/          # custom words
│   ├── auth/               # login & register pages
│   ├── game/[id]/          # active game page
│   ├── lobby/[code]/       # game lobby + create
│   ├── home/               # user dashboard
│   ├── friends/            # friends page
│   ├── leaderboard/        # leaderboard page
│   ├── profile/            # user profile
│   ├── history/            # game history
│   ├── replay/             # game replay viewer
│   ├── modes/              # game modes
│   ├── settings/           # user settings
│   ├── tournament/         # tournaments
│   ├── join/[code]/        # direct join via link
│   ├── globals.css         # global styles + themes
│   ├── layout.tsx          # root layout
│   ├── providers.tsx       # React context providers
│   ├── error.tsx           # global error page
│   └── not-found.tsx       # 404 page
│
├── components/             # React components
│   ├── game/               # 14 game components
│   │   ├── CardFlip.tsx    # animated word card
│   │   ├── ClueSystem.tsx  # clue submission
│   │   ├── DiscussionChat.tsx # in-game chat
│   │   ├── VotingPanel.tsx # voting interface
│   │   ├── ResultScreen.tsx # game results
│   │   ├── SpectatorView.tsx # eliminated player view
│   │   └── ...
│   ├── layout/NavBar.tsx   # navigation bar
│   ├── ui/                 # reusable UI (Button, Card, Modal, Toast...)
│   └── ErrorBoundary.tsx   # error boundary wrapper
│
├── hooks/                  # custom React hooks
│   ├── useSocket.ts        # socket.io connection
│   ├── useGame.ts          # game state management
│   ├── useRoom.ts          # room/lobby state
│   ├── useSound.ts         # audio playback
│   └── useTranslation.ts   # i18n hook
│
├── lib/                    # utilities & models
│   ├── models/             # Mongoose schemas (User, Game, Room, Word, Category)
│   ├── i18n/               # translations (az.json, en.json)
│   ├── mongodb.ts          # DB connection
│   ├── auth.ts             # JWT helpers
│   ├── socket.ts           # socket client singleton
│   ├── sounds.ts           # Howler.js manager
│   ├── animations.ts       # Framer Motion configs
│   ├── xp.ts               # XP & leveling system
│   ├── badges.ts           # badge unlock logic
│   ├── daily.ts            # daily challenges
│   ├── rate-limit.ts       # API rate limiter
│   └── ...
│
├── server/                 # Socket.io server (Node.js)
│   ├── index.js            # server entry point + auth middleware
│   ├── game.js             # game logic (rounds, voting, clues)
│   ├── rooms.js            # room management (create, join, leave)
│   ├── chat.js             # discussion chat handler
│   ├── wordLoader.js       # word/category loader
│   └── words.json          # word database (142KB, 10+ categories)
│
├── data/                   # persistent JSON storage
│   ├── words.json          # game words
│   ├── custom-words.json   # user-submitted words
│   ├── rooms-persist.json  # room state backup
│   ├── friends.json        # friend relationships
│   ├── replays.json        # game replays
│   └── tournaments.json    # tournament data
│
├── public/                 # static assets
│   ├── sounds/             # 15 audio files (mp3)
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # service worker
│   └── icon-192.svg        # app icon
│
├── scripts/                # utility scripts
│   ├── seed-words.ts       # seed MongoDB with words
│   ├── healthcheck.mjs     # server health check
│   ├── test-api.mjs        # API endpoint tests
│   ├── test-socket.mjs     # socket connection test
│   └── get-ip.js           # local IP finder
│
├── types/index.ts          # global TypeScript types
├── .env.example            # environment template
├── Dockerfile              # Docker container config
├── docker-compose.yml      # multi-container setup
├── next.config.mjs         # Next.js + PWA + security headers
├── tailwind.config.ts      # custom theme (gold, dark, cream)
└── package.json            # dependencies & scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20)
- **npm** 9+
- **MongoDB Atlas** account (free tier works) — or local MongoDB

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/shade-game.git
cd shade-game/shade

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Configure Environment

Edit `.env.local` with your values:

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shade?retryWrites=true&w=majority

# Socket.io server URL (use your local IP for mobile testing)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_secret_here

# Optional: Pexels API key for word images
PEXELS_API_KEY=
```

### Seed the Database (first time only)

```bash
npm run seed
```

### Start Development

```bash
# Start EVERYTHING with one command (frontend + socket server)
npm run dev:all
```

This starts:
- **Next.js** frontend at `http://localhost:3000`
- **Socket.io** server at `http://localhost:3001`

Open `http://localhost:3000` in your browser to play.

### Mobile / LAN Testing

To test on mobile devices on the same Wi-Fi network:

```bash
# Find your local IP
npm run check-ip

# Update .env.local
NEXT_PUBLIC_SOCKET_URL=http://192.168.x.x:3001

# Restart
npm run dev:all
```

Then open `http://192.168.x.x:3000` on your phone.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `NEXT_PUBLIC_SOCKET_URL` | Yes | Socket.io server URL (public, exposed to client) |
| `JWT_SECRET` | Production | Secret key for JWT tokens |
| `PEXELS_API_KEY` | No | Pexels API for word images |
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Socket server port (default: 3001) |
| `SOCKET_CORS_ORIGIN` | No | Allowed CORS origins (comma-separated) |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start frontend + socket server (development) |
| `npm run start:prod` | Start frontend + socket server (production) |
| `npm run dev` | Start Next.js frontend only |
| `npm run server` | Start socket server only |
| `npm run build` | Build Next.js for production |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed MongoDB with words |
| `npm run seed:force` | Force re-seed (overwrites existing) |
| `npm run check-ip` | Show local IP address |

---

## Game Flow

```
1. CREATE ROOM          2. LOBBY                 3. GAME START
   Host creates room       Players join with        Server assigns roles:
   with settings:          room code or link        - Citizens get REAL word
   - Category                                       - Imposter gets FAKE word
   - Round count           Host starts when
   - Max players           3+ players ready

4. CLUE PHASE           5. DISCUSSION            6. VOTING
   Each player gives       Players discuss          Players vote to
   a one-word clue         who might be the         eliminate suspected
   related to their        imposter based           imposter
   word (timed)            on clues (timed)

7. ELIMINATION          8. NEXT ROUND            9. GAME END
   Most-voted player       If imposter still        Final scores,
   is eliminated           alive, next round        XP rewards,
   (becomes spectator)     begins at step 4         badge unlocks
```

**Win Conditions:**
- **Citizens win** if the imposter is voted out
- **Imposter wins** if they survive all rounds or if citizens vote out a citizen

---

## Architecture

```
┌─────────────────────────────────┐
│         Browser (Client)         │
│  Next.js 14 + React + Tailwind  │
│  Socket.io-client               │
├─────────────────────────────────┤
│              │                   │
│    REST API  │   WebSocket       │
│   (Next.js)  │  (Socket.io)     │
│              │                   │
├──────────────┼───────────────────┤
│  Next.js API │  Express Server   │
│  Routes      │  Socket.io Server │
│  Port 3000   │  Port 3001        │
├──────────────┴───────────────────┤
│          MongoDB Atlas           │
│  Users, Games, Words, Categories │
└──────────────────────────────────┘
```

**Key design decisions:**
- **Separate socket server** — Socket.io runs independently from Next.js on port 3001 for scalability
- **In-memory game state** — Active rooms/games are kept in a `Map` for speed, not in MongoDB
- **Room persistence** — Room state is backed up to `data/rooms-persist.json` on shutdown
- **Guest mode** — Server generates cryptographic guest IDs; no client-side userId trust

---

## Deployment

### Option 1: Vercel (Frontend) + Railway/Render (Socket Server)

Since Vercel doesn't support persistent WebSocket connections, you need to deploy the socket server separately:

**Frontend (Vercel):**
```bash
# Push to GitHub, then import in Vercel
# Set environment variables in Vercel dashboard:
# - MONGODB_URI
# - JWT_SECRET
# - NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```

**Socket Server (Railway / Render / Fly.io):**
```bash
# Deploy the server/ directory
# Entry point: node server/index.js
# Port: 3001
# Environment variables: MONGODB_URI, JWT_SECRET, SOCKET_CORS_ORIGIN
```

### Option 2: Docker (Single Host)

```bash
# Build and run
docker-compose up -d

# Or manually
docker build -t shade .
docker run -p 3000:3000 -p 3001:3001 \
  -e MONGODB_URI=your_uri \
  -e JWT_SECRET=your_secret \
  shade
```

### Option 3: VPS (DigitalOcean, AWS, etc.)

```bash
npm install
npm run build
npm run start:prod
```

Use **nginx** as reverse proxy with SSL for production.

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/categories` | List game categories |
| GET | `/api/leaderboard` | Get rankings |
| POST | `/api/rooms` | Create room |
| GET | `/api/rooms` | List rooms |
| POST | `/api/rooms/[code]/join` | Join room |
| GET/POST | `/api/friends` | Friend management |
| GET | `/api/users/[id]` | User profile |
| GET | `/api/users/[id]/history` | Game history |
| GET/POST | `/api/replays` | Game replays |
| GET/POST | `/api/words/custom` | Custom words |
| GET/POST | `/api/tournaments` | Tournaments |

---

## Socket Events

### Client → Server

| Event | Description |
|-------|-------------|
| `room:create` | Create a new game room |
| `room:join` | Join room with code |
| `room:leave` | Leave current room |
| `room:settings` | Update room settings |
| `game:start` | Host starts the game |
| `clue:submit` | Submit a word clue |
| `vote:cast` | Vote to eliminate a player |
| `chat:message` | Send chat message |
| `emoji:send` | Send emoji reaction |
| `player:reconnect` | Reconnect to room |

### Server → Client

| Event | Description |
|-------|-------------|
| `room:created` | Room successfully created |
| `room:joined` | Player joined room |
| `room:updated` | Room state changed |
| `game:word` | Receive your secret word + role |
| `game:clue-phase` | Clue phase started |
| `game:clues` | All clues submitted |
| `game:discussion` | Discussion phase started |
| `game:voting` | Voting phase started |
| `game:vote-result` | Voting result |
| `game:end` | Game over with final results |
| `chat:message` | Incoming chat message |
| `emoji:receive` | Incoming emoji |

---

## Security

- **Authentication**: JWT tokens with httpOnly cookies; bcrypt password hashing (salt rounds: 12)
- **Rate Limiting**: API routes (5 req/min login, 3 req/min register); Socket events (per-event cooldowns)
- **Input Validation**: Display names sanitized against XSS, NoSQL injection (`$`, `.`, `<`, `>` blocked)
- **CORS**: Production lockdown — explicit origin whitelist, no wildcard `*`
- **Headers**: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
- **Guest IDs**: Server-generated with `crypto.randomBytes` — clients cannot forge IDs
- **Authorization**: Socket handlers verify player membership before accepting game actions

---

## Development Notes

### Theme Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Gold | `#C8A44E` | Primary accent, buttons, highlights |
| Dark | `#0D0D0C` | Background (dark theme) |
| Cream | `#E8E4D8` | Text, cards (dark theme) |
| Red | `#E8593C` | Imposter, errors, danger |
| Green | `#B8D4A8` | Citizen, success |
| Blue | `#A8C4E0` | Info, links |

### Adding New Categories
1. Add words to `server/words.json` under a new category key
2. Run `npm run seed:force` to update MongoDB
3. The category will automatically appear in the game

### Adding Translations
1. Edit `lib/i18n/az.json` (Azerbaijani) or `lib/i18n/en.json` (English)
2. Use the `useTranslation` hook in components: `const { t } = useTranslation()`

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run linting: `npm run lint`
5. Build to verify: `npm run build`
6. Commit and push
7. Open a Pull Request

---

## License

This project is private. All rights reserved.

---

**Built with love and foxes by the SHADE team.**
