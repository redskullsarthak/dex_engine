import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import * as Types from '../cores/types'
import { json } from "zod/mini";
export const fastify = Fastify({
  logger: true
})
fastify.register(fastifyWebsocket);

// fastify.get('/api/orders/status',{websocket:true},(req,reply)=>{

// });

const InMemoryOrders=[];// for now 

fastify.post('/api/orders/execute', (req, reply) => {
      const order=JSON.parse(req.body as string);
      const orderId = crypto.randomUUID();// random order id 
      InMemoryOrders.push(order);
      // will do some processing here 
});


fastify.listen({ port: 3000 });
