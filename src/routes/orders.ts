import Fastify from "fastify";
const fastify = Fastify({
  logger: true
})

fastify.post('/api/orders/execute',(req,reply)=>{
      // do something establish the web socket here 
});


fastify.listen({ port: 3000 })
