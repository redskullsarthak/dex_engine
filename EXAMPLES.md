# API Usage Examples

## Prerequisites
Make sure both services are running:
```bash
# Terminal 1: Start API server
npm run dev

# Terminal 2: Start worker
npm run dev:worker

# Terminal 3: Verify Redis is running
redis-cli ping  # Should return "PONG"
```

---

## 1. Execute an Order (HTTP POST)

### Request
```bash
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "SOL",
    "tokenOut": "USDC",
    "amountIn": 1.5,
    "slippageBps": 50
  }'
```

### Expected Response
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### What Happens
1. Order is saved to database with status `"pending"`
2. Job is enqueued in Redis/BullMQ
3. Worker picks up the job and processes through statuses:
   - `pending` → `routing` → `building` → `submitted` → `confirmed`
4. Updates are saved to database

---

## 2. Monitor Order via WebSocket

### Connect with WebSocket Client
```bash
# Using websocat (install: brew install websocat)
websocat "ws://localhost:3000/ws/orders?orderId=550e8400-e29b-41d4-a716-446655440000"
```

### Expected Messages (Real-time Updates)
```json
{"orderId":"550e8400-e29b-41d4-a716-446655440000","status":"routing"}

{"orderId":"550e8400-e29b-41d4-a716-446655440000","status":"routing","chosenDex":"raydium"}

{"orderId":"550e8400-e29b-41d4-a716-446655440000","status":"building","chosenDex":"raydium"}

{"orderId":"550e8400-e29b-41d4-a716-446655440000","status":"submitted","txHash":"0xabcd..."}

{"orderId":"550e8400-e29b-41d4-a716-446655440000","status":"confirmed","executedPrice":150.25}
```

### Connection Rules
- **With orderId**: Connection accepted, receives updates
- **Without orderId**: Connection rejected with message `"orderId query parameter required"`

---

## 3. Complete Flow Example

### Using cURL + websocat
```bash
# Step 1: Connect WebSocket (in one terminal)
websocat "ws://localhost:3000/ws/orders?orderId=YOUR_ORDER_ID_HERE"

# Step 2: Execute order (in another terminal)
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "SOL",
    "tokenOut": "USDC",
    "amountIn": 2.0,
    "slippageBps": 100
  }'

# Copy the orderId from response and update WebSocket URL
```

### Using JavaScript/Node.js
```javascript
const WebSocket = require('ws');

// Step 1: Execute order
const response = await fetch('http://localhost:3000/api/orders/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenIn: 'SOL',
    tokenOut: 'USDC',
    amountIn: 1.5,
    slippageBps: 50
  })
});

const { orderId } = await response.json();
console.log('Order created:', orderId);

// Step 2: Connect WebSocket
const ws = new WebSocket(`ws://localhost:3000/ws/orders?orderId=${orderId}`);

ws.on('message', (data) => {
  const update = JSON.parse(data);
  console.log('Status update:', update);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

## 4. Using Postman Collection

Import the collection:
```bash
postman/dex-engine-collection.json
```

### Available Requests:
1. **Execute Order (Basic)** - Simple POST with hardcoded values
2. **Execute Order (Random Amount)** - POST with dynamic amount
3. **Execute Order (Save orderId)** - POST that saves orderId to environment
4. **Monitor Order (WebSocket)** - Auto-uses saved orderId

### Postman Flow:
1. Run "Execute Order (Save orderId)"
2. Immediately run "Monitor Order (WebSocket)"
3. Watch real-time updates in WebSocket messages

---

## 5. Expected Order Lifecycle

### Successful Flow
```
pending → routing → building → submitted → confirmed
   ↓          ↓          ↓          ↓           ↓
 (0.5s)    (1s)      (1.5s)     (2s)       (2.5s)
```

### Failed Flow
```
pending → routing → failed
   ↓          ↓         ↓
 (0.5s)    (1s)   (error occurs)
```

### Database Fields Updated
- `status` - Current order status
- `chosenDex` - Selected DEX (raydium/meteora) during routing
- `executedPrice` - Final execution price on confirmation
- `txHash` - Transaction hash when submitted
- `failureReason` - Error message if failed

---

## 6. Testing Different Scenarios

### Test Invalid JSON
```bash
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```
**Expected**: `{"error":"invalid json"}` with status 400

### Test WebSocket Without orderId
```bash
websocat "ws://localhost:3000/ws/orders"
```
**Expected**: Receives `"orderId query parameter required"` and connection closes

### Test Multiple Concurrent Orders
```bash
# Submit 3 orders simultaneously
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/orders/execute \
    -H "Content-Type: application/json" \
    -d "{\"tokenIn\":\"SOL\",\"tokenOut\":\"USDC\",\"amountIn\":$i,\"slippageBps\":50}" &
done
wait
```
**Expected**: 3 different orderIds, all processed independently

---

## 7. Verify Order in Database

### Using Prisma Studio
```bash
npx prisma studio
```
Opens browser UI at `http://localhost:5555` to view all orders

### Using SQLite CLI
```bash
sqlite3 prisma/dev.db "SELECT id, status, tokenIn, tokenOut, amountIn, chosenDex FROM Order;"
```

---

## Order Schema Reference

```typescript
{
  tokenIn: string;      // e.g., "SOL"
  tokenOut: string;     // e.g., "USDC"
  amountIn: number;     // e.g., 1.5
  slippageBps?: number; // Optional, default: 100 (1%)
}
```

### Response Schema
```typescript
{
  orderId: string;  // UUID format
}
```

### WebSocket Message Schema
```typescript
{
  orderId: string;
  status: "pending" | "routing" | "building" | "submitted" | "confirmed" | "failed";
  chosenDex?: "raydium" | "meteora";
  executedPrice?: number;
  txHash?: string;
  failureReason?: string;
}
```
