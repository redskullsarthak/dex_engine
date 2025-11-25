const WebSocket = require('ws');

const orderId = 'test-' + Date.now();
const ws = new WebSocket(`ws://localhost:3000/ws/orders?orderId=${orderId}`);

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log(`Connected with orderId: ${orderId}`);
});

ws.on('message', (data) => {
  console.log('📨 Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log('🔌 Connection closed');
  console.log('Close code:', code);
  console.log('Close reason:', reason.toString());
  process.exit(0);
});

// Keep alive for 3 seconds
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
}, 3000);
