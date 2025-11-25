# dex_engine

A Fastify + BullMQ demo that queues market swap orders, simulates routing between Raydium and Meteora, persists them with Prisma/SQLite, and streams per-order status updates over WebSockets.

## Prerequisites
- Node.js 18+
- Redis reachable at `REDIS_URL` (defaults to `redis://127.0.0.1:6379`)
- `DATABASE_URL` for Prisma (SQLite example: `file:./dev.db`)

## Setup
1. Create a `.env` with values such as:
   ```env
   DATABASE_URL="file:./dev.db"
   REDIS_URL="redis://127.0.0.1:6379"
   ```
2. Install dependencies: `npm install`
3. Generate the Prisma client: `npx prisma generate`
4. Sync the schema to SQLite: `npx prisma db push` (or `npx prisma migrate dev --name init` if you prefer migrations)
5. Ensure Redis is running locally (start your service or `docker run -p 6379:6379 redis`)

## Running the app
- Start the API (Fastify + WebSocket) on port 3000:
  ```bash
  npm run dev
  # or
  npm run dev:api
  ```
- In a second terminal, start the worker that consumes BullMQ jobs:
  ```bash
  npm run dev:worker
  ```

## API & WebSocket flow
1. Submit a market order:
   ```bash
   curl -X POST http://localhost:3000/api/orders/execute \
     -H "Content-Type: application/json" \
     -d '{"tokenIn":"USDC","tokenOut":"SOL","amountIn":100,"slippageBps":75}'
   ```
   Response includes `{"orderId":"..."}` persisted to SQLite and enqueued to BullMQ.
2. Subscribe to status updates for that order:
   - Connect to `ws://localhost:3000/ws/orders?orderId=<id>`
   - Messages stream through the lifecycle: `pending → routing → building (quotes) → submitted → confirmed` or `failed`, with extras like `chosenDex`, `txHash`, and `executedPrice`.

## How it works
- `src/routes/orders.ts` exposes REST + WebSocket endpoints and enqueues jobs to `orderQueue`.
- `src/queue/orderWorker.ts` consumes jobs, calls the mocked `DexEngine`, and emits lifecycle updates via `sendStatus`.
- `src/cores/statusPublisher.ts` persists status/metadata to Prisma and pushes the same payload over the WebSocket mapped in `src/cores/orderMap.ts`.
- `src/cores/mockDexEngine.ts` simulates Raydium/Meteora pricing and execution with basic slippage handling.

## Testing
- Run the suite with `npm test` (vitest). Redis must be available; SQLite test DBs are created as files (`test.db`, `test-ws.db`). Some heavier integration tests are marked `.skip` to keep the default run fast.

## Useful scripts
- `npm run dev` / `npm run dev:api`: start the Fastify API + WebSocket server
- `npm run dev:worker`: start the BullMQ worker
- `npm test`: run the vitest suite
