# DEX Engine - Testing Guide

## Test Suite Overview

The DEX engine includes **15 comprehensive tests** covering:
- **Unit tests**: Routing logic (6 tests)
- **Integration tests**: Queue processing (4 tests)
- **E2E tests**: WebSocket communication (5 tests)

## Test Results Summary

✅ **Routing Tests: 6/6 passing**
- Pick best DEX based on output amount
- Handle fee calculations correctly
- Edge cases (equal quotes, zero/high fees)

⚠️ **Queue Tests: 4 tests** (requires Redis)
- Job enqueueing
- Worker processing with DB updates
- Failure handling and retries
- Retry configuration

⚠️ **WebSocket Tests: 5 tests** (requires Redis)
- Connection management with orderId
- Status update streaming
- Multiple concurrent connections
- Cleanup on disconnect

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Redis** (required for queue/websocket tests):
   ```bash
   redis-server
   ```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with UI

```bash
npm run test:ui
```
Open http://localhost:51204 in browser

### Run Only Routing Tests (No Redis Required)

```bash
npx vitest run src/__tests__/routing.test.ts
```

### Run with Coverage

```bash
npm run test:coverage
```

## Test Files

### 1. Routing Unit Tests (`src/__tests__/routing.test.ts`)

Tests the `pickBestQuote` function that selects optimal DEX:

- ✅ Picks Raydium when it has better output
- ✅ Picks Meteora when it has better output  
- ✅ Handles tie-breaking (chooses Raydium)
- ✅ Correctly calculates output amounts with fees
- ✅ Handles zero fee edge case
- ✅ Handles high fee edge case

**Example:**
```typescript
const raydium: Types.Quote = {
  dex: 'raydium',
  quoteVal: 1.05,
  fee: 0.003, // 0.3%
};
const result = pickBestQuote(mockOrder, raydium, meteora);
expect(result.chosenDex).toBe('raydium');
```

### 2. Queue Processing Tests (`src/__tests__/queue.test.ts`)

Tests BullMQ job processing with Redis + Prisma:

- ✅ Enqueues jobs successfully
- ✅ Worker processes jobs and updates DB status
- ✅ Handles failures and marks orders as failed
- ✅ Retries failed jobs according to configuration

**Setup:**
- Uses Redis DB 1 for test isolation
- Uses `test.db` SQLite database
- Auto-creates test schema on start

### 3. WebSocket Integration Tests (`src/__tests__/websocket.test.ts`)

Tests real-time order status streaming:

- ✅ Accepts WebSocket connections with orderId
- ⚠️ Rejects connections without orderId
- ✅ Streams status updates (pending → routing → building → submitted → confirmed)
- ⚠️ Handles multiple concurrent connections
- ⚠️ Cleans up orderMap on disconnect

**Flow tested:**
1. POST `/api/orders/execute` → creates order
2. Connect WebSocket with `orderId`
3. Receive status messages in real-time
4. Verify DB persistence

## Postman Collection

Located at: `postman/dex-engine-collection.json`

### Import to Postman

1. Open Postman
2. Click **Import**
3. Select `postman/dex-engine-collection.json`
4. Collection includes:
   - POST `/api/orders/execute` (3 variants)
   - WebSocket `/ws/orders?orderId={{orderId}}`

### Using the Collection

1. **Execute Order:**
   - Send POST request
   - OrderId saved to collection variable automatically

2. **Connect WebSocket:**
   - Open WebSocket request
   - Uses `{{orderId}}` from previous POST
   - Receive real-time status updates

### Expected WebSocket Messages

```json
{"orderId":"xxx","status":"pending"}
{"orderId":"xxx","status":"routing"}
{"orderId":"xxx","status":"building","chosenDex":"raydium"}
{"orderId":"xxx","status":"submitted","chosenDex":"raydium"}
{"orderId":"xxx","status":"confirmed","txHash":"...","executedPrice":1.05}
```

## Test Database Cleanup

Tests use separate databases:
- Queue tests: `test.db`
- WebSocket tests: `test-ws.db`

**Manual cleanup:**
```bash
rm test.db test-ws.db
```

## CI/CD Integration

**GitHub Actions example:**

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
```

## Troubleshooting

### Redis Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:** Start Redis before running tests
```bash
redis-server
```

### Test Timeouts

Some tests timeout if Redis is slow to start. Increase timeout in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 20000, // 20 seconds
  },
});
```

### Database Lock Errors

If tests fail with SQLite lock errors:
```bash
rm test.db test-ws.db
npm test
```

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    const result = yourFunction();
    expect(result).toBe(expected);
  });
});
```

### Integration Test Template

```typescript
import { describe, it, beforeAll, afterAll } from 'vitest';

describe('Integration Test', () => {
  beforeAll(async () => {
    // Setup resources
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should test integration', async () => {
    // Test logic
  });
});
```

## Test Coverage Goals

- **Routing logic**: ✅ 100% coverage
- **Queue processing**: 🎯 Target 80%+
- **WebSocket handling**: 🎯 Target 80%+
- **Database operations**: 🎯 Target 70%+

Run coverage report:
```bash
npm run test:coverage
```
