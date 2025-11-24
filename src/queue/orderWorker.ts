import { Worker } from 'bullmq';
import { redis } from '../redis';
import { worker as processOrder } from '../cores/workers';

export const orderWorker = new Worker('orders', async (job) => {
  const { orderId } = job.data as { orderId: string };
  await processOrder(orderId);
}, {
  connection: redis,
});
