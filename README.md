# KADO CLICKER

A responsive KADO homepage and playful idle clicker built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, and Lucide. The homepage is `/`, with links to play, coin information, the developing fictional lore, and community proposals; the game is available at `/play`. Community participation does not require crypto or on-chain activity. Game progress is stored locally in your browser; no wallet or token transaction is involved.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). Run `npm test` for the game logic tests or `npm run build` to create a production build in `dist/`.

The homepage uses the supplied KADO photos in `public/images/`. Click **PLAY KADO CLICKER** to open the existing game without changing its local save data.

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

### Competitive leaderboards

The three public rankings use Supabase Auth and server-calculated game actions. To enable them:

1. Create a Supabase project.
2. Run `supabase/migrations/20261016000000_competitive_leaderboards.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the project's API settings.
4. Add those same variables to the Vercel project's Production (and Preview, if desired) environment variables, then redeploy.

The anon/publishable key is intended for browser use. Never put a Supabase service-role key in a `VITE_` variable or client-side code. Until the Supabase project, migration, and client environment variables are configured, the game remains playable with local browser saves, but sign-in and public rankings are unavailable.

## Gameplay and privacy

KADO Points are virtual in-game points and have no cash value. They are not redeemable for $KADO tokens. Signed-out progress is saved in localStorage, with JSON save export/import in Settings and up to eight hours of offline passive earnings. Ranked accounts use a separate server-managed game state; existing local saves are not imported because their scores cannot be verified, and remain available in the browser for local play or export. Clients never submit score totals: the database calculates points from allowed actions, checks purchases, and applies a per-account click rate limit. These measures discourage casual tampering but cannot fully prevent bots, automation, or modified clients, so rankings are best-effort rather than cheat-proof. Public usernames and scores appear on the leaderboard; email addresses do not.
