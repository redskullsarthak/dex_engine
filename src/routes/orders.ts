import Fastify from "fastify";
import fastifyWebsocket from '@fastify/websocket';
import * as Types from '../cores/types';
import { worker } from "../cores/workers";
import { orderQueue } from "../queue/orderQueue";
import { prisma } from "../db";
import { orderMap } from '../cores/orderMap';

export const fastify = Fastify({
  logger: true
})

export const InMemoryOrders: any[] = [];// for now 

// Register WebSocket plugin
fastify.register(fastifyWebsocket);

fastify.get('/ws/orders', { websocket: true }, (connection: any, req: any) => {
  const query = req.query as Record<string, string | undefined>;
  const orderId = query?.orderId;
  if (!orderId) {
    connection.socket.send('orderId query parameter required');
    connection.socket.terminate();
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
      
      // Create order in database with UUID and pending status
      const dbOrder = await prisma.order.create({
        data: {
          type: 'market',
          tokenIn: orderBody.tokenIn,
          tokenOut: orderBody.tokenOut,
          amountIn: orderBody.amountIn,
          slippageBps: orderBody.slippageBps ?? 100,
          status: 'pending',
        },
      });
      
      // Enqueue job with DB-generated orderId
      await orderQueue.add('execute-order', { orderId: dbOrder.id });
      return { orderId: dbOrder.id };
});


fastify.listen({ port: 3000 });
