# Nexuz Arena

Nexuz Arena is a competitive gaming platform with cryptocurrency rewards on the Sui blockchain. Players can discover games, track their scores, join competitions, and create public, private, or sponsored game rooms. The platform combines entry fees, prize pools, refunds, and payouts with wallets and community features in a single web application.

## What the product does

- **Games and leaderboards:** Access games such as Endless Runner and Flappy Bird, record game sessions, and compare scores and rankings.
- **Game rooms:** Create or join public and private rooms, collect entry fees, sponsor prize pools, and manage participation, cancellations, and refunds.
- **Tournaments:** Organize competitions with participant approvals, round-robin or single-elimination brackets, score submission, and results.
- **Wallets and rewards:** Set up a Sui wallet, view SUI, USDC, and USDT balances, transfer tokens, and swap supported tokens through Cetus. Sui smart-contract integrations handle game-room funds and prize distribution.
- **Community:** Manage profiles, chat rooms, friend requests, invitations, and notifications.
- **Administration:** Manage games, rooms, tournaments, users, and platform activity through administrative screens.

A typical player signs in, sets up a wallet, selects a game or competition, and joins a room. Depending on the room, players pay an entry fee or participate in a sponsored competition. Game scores feed into rankings and competition results, with room lifecycle and contract integrations supporting refunds and prize payouts.

## Technology

| Area | Technology |
| --- | --- |
| Web application | React 19, TypeScript, Vite, React Router |
| Interface | Tailwind CSS, shadcn/ui, Radix UI, Recharts |
| Accounts and application data | Supabase authentication, database, and realtime subscriptions |
| Blockchain | Sui SDKs and smart-contract integrations |
| Token swaps | Cetus SDKs |
| Data fetching | TanStack React Query |
| Email integration | Resend; current browser-side integration needs server-side handling before production use |

LI.FI 4 is installed, but its widget is not currently integrated into the application UI. The existing swap interface uses Cetus.

## Local development

### Prerequisites

- Node.js 22.12 or newer; dependency maintenance was verified with Node.js 22.23.1 and npm 10.9.8.
- npm, using the committed `package-lock.json` for reproducible installs.
- A Supabase project with the schema expected by the application. See the generated [database types](./src/integrations/supabase/types.ts) and available [migrations](./supabase/migrations/). Enable the authentication providers you intend to use.

From the repository directory, install dependencies:

```sh
npm ci
```

Create an untracked `.env.local` with the public Supabase configuration:

```dotenv
VITE_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
VITE_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
```

Use a public publishable key here, not a Supabase service-role key. Google sign-in, when enabled, redirects back to `/dashboard`; allow the corresponding local and deployed redirect URLs in your Supabase authentication settings.

**Configuration limits:** Public Supabase settings alone do not enable every integration. The current email client reads `VITE_RESEND_API_KEY`, `VITE_SENDER_ADDRESS`, and `VITE_APP_URL`, and throws during initialization if the email API key is absent. Sponsor signing also reads `VITE_PRIVATE_KEY`. Vite exposes `VITE_*` values to the browser, so do not put real email API secrets or sponsor private keys into these variables. Secret-backed email and sponsor operations need server-side handling before production deployment. This README does not resolve those application limitations.

Start the development server:

```sh
npm run dev
```

The configured development address is `http://localhost:8080`.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the application into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npx tsc -p tsconfig.app.json --noEmit` | Check application types |
| `npm run test:dependencies` | Run isolated browser and dependency regression checks |
| `npm audit` | Check the complete dependency tree for reported vulnerabilities |
| `npm audit --omit=dev` | Check production dependencies |

The dependency regression check requires Chrome or a compatible executable selected through `CHROME_BIN`. It uses a temporary browser profile, a fixture-only dummy email key, mocked market-price responses, and blocks other external requests. It checks calendar behavior, routing, dialogs, drawers, charts, LI.FI import compatibility, and the unauthenticated dashboard redirect without sending email or submitting blockchain transactions.

## Current status and testing limits

The repository contains application flows connected to Supabase and Sui alongside unfinished areas. The marketplace currently uses mock items; its presence in navigation does not mean marketplace purchasing is fully implemented.

The application defaults to **Sui mainnet** in [src/constants.ts](./src/constants.ts). Game-room lifecycle and transfer scripts can submit transactions and move funds. Confirm the selected network, contract addresses, and test accounts before running them; they are separate from the isolated dependency regression check.

Live wallet signing, swaps, funded game-room transactions, and real email delivery were not validated during the dependency upgrade. Existing lint and TypeScript errors also remain. See [dependency maintenance and verification](./DEPENDENCIES.md) for the audit snapshot, compatibility decisions, and known limits.

For blockchain integration testing, read the [game-room lifecycle test guide](./scripts/game-room-tests/README.md) and the [additional game-room testing notes](./scripts/README-game-room-testing.md) before running the scripts.
