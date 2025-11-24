import { Queue } from 'bullmq';
import { redis } from '../redis';

export const orderQueue = new Queue('orders', {
  connection: redis,
});
