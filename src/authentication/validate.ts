import { errorCodes } from 'fastify';
import * as Types from '../cores/types'
import {fastify} from '../routes/orders'


fastify.addHook('preHandler', (req, reply,done) => { // hook 1 for type validation for now 
   const body = JSON.parse(req.body as string);
   const validation = Types.OrderStatus.safeParse(body);
   if (!validation.success||body.type!=='market'){
       reply.send("only market is supported for now").code(400);
   }
   done();
});

