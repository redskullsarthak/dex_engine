import Fastify from "fastify";
import * as Types from '../cores/types'
export const fastify = Fastify({
  logger: true
})
// @ts-ignore: allow dynamic require for plugin registration
fastify.register(require('@fastify/websocket'));
const InMemoryOrders: any[] = [];// for now 
export const orderMap = new Map<string, any>();
const makeId = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);



fastify.get('/ws/orders', { websocket: true } as any, (connection, req) => {
  const query = (req as any).query as Record<string, string | undefined>;
  const orderId = query?.orderId;
  if (!orderId) {
    try { connection.socket.close(1008,'orderId query parameter required'); } catch (e) {};
    return;
  }
  orderMap.set(orderId, connection.socket);
  connection.socket.on('close', () => {
    orderMap.delete(orderId);
  });
});

fastify.post('/api/orders/execute', async (req, reply) => {
      let order: any;
      try {
        order = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (err) {
        reply.status(400).send({ error: 'invalid json' });
        return;
      }
      const orderId = makeId();// random order id 
      InMemoryOrders.push({ id: orderId, ...order });
      // will do some processing here 
      return { orderId };
});


fastify.listen({ port: 3000 });
