import Fastify from "fastify";
import * as Types from '../cores/types'
import { worker } from "../cores/workers";
import { orderQueue } from "../queue/orderQueue";
export const fastify = Fastify({
  logger: true
})
// @ts-ignore: allow dynamic require for plugin registration
fastify.register(require('@fastify/websocket'));
export const InMemoryOrders: any[] = [];// for now 
export const orderMap = new Map<string, any>();
const makeId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);

fastify.get('/ws/orders', { websocket: true } as any, (connection, req) => {
  const query = (req as any).query as Record<string, string | undefined>;
  const orderId = query?.orderId;
  if (!orderId) {
    try { connection.socket.end('orderId query parameter required'); } catch (e) {};
    return;
  }
  orderMap.set(orderId, connection.socket);
  connection.socket.on('close', () => {
    orderMap.delete(orderId);
  });
});



fastify.post('/api/orders/execute', async (req, reply) => {
      let orderBody: any;
      try {
        orderBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (err) {
        reply.status(400).send({ error: 'invalid json' });
        return;
      }
      const orderId = makeId();
      const order: Types.Order = {
      id: orderId,
      type: 'market',
      tokenIn: orderBody.tokenIn,
      tokenOut: orderBody.tokenOut,
      amountIn: orderBody.amountIn,
      slippageBps: orderBody.slippageBps ?? 100,
      };
      InMemoryOrders.push(order);
      await orderQueue.add('execute-order', { orderId });
      return { orderId };
});


fastify.listen({ port: 3000 });
