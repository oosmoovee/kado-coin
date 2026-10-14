# KADO CLICKER

A playful, responsive idle clicker built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Lucide. Game progress is stored locally in your browser; no wallet or token transaction is involved.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). Run `npm test` for the game logic tests or `npm run build` to create a production build in `dist/`.

## Kado images

Kado's supplied golden coin portrait is included as `public/kado.jpg` and used as the default clicker image. To replace it, add a `public/kado.png` image. Optional stage-specific PNG files override the default when present:

- `kado-baby.png`
- `kado-happy.png`
- `kado-dripped.png`
- `kado-golden.png`
- `kado-galactic.png`
- `kado-legendary.png`

The image uses `object-fit: contain`; transparent backgrounds work best. Missing image files are handled automatically with the illustrated dog placeholder.

## Community links

Set these optional Vite environment variables in a `.env` file at the project root:

```env
VITE_TWITTER_URL=https://x.com/KadoCoinDev
VITE_TELEGRAM_URL=https://t.me/KADOCOINCOMMUNITY
VITE_COMMUNITY_URL=
VITE_CONTRACT_ADDRESS=8Eznb1ZdDjxa7ayXxDbieW2uRG5xgn1L3rudRz4Rpump
```

The defaults are the official community links and contract address shown above; environment variables can override them for a deployment. The game does not connect to a token contract. Never put secrets in Vite environment variables; they are public in the built website.

## Deployment

The `main` branch is connected to Vercel. Push commits to `main` to create production deployments; other branches and pull requests can create preview deployments.

## Gameplay and privacy

KADO Points are virtual in-game points and have no cash value. They are not redeemable for $KADO tokens. The leaderboard is not connected to a backend and no rankings are shown. Progress is saved in localStorage, with JSON save export/import in Settings and up to eight hours of offline passive earnings.
