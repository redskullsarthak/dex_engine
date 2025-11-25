import { Worker } from 'bullmq';
import { redis } from '../redis';
import { worker as processOrder } from '../cores/workers';
import { sendStatus } from '../cores/statusPublisher';

export const orderWorker = new Worker('orders', async (job) => {
  const { orderId } = job.data as { orderId: string };
  await processOrder(orderId);
}, {
  connection: redis,
});

// Handle failed jobs - ensure DB status is "failed" and broadcast over WS
orderWorker.on('failed', async (job, err) => {
  if (job && job.data?.orderId) {
    const orderId = job.data.orderId;
    await sendStatus(orderId, 'failed', {
      failureReason: `Job failed after retries: ${err.message}`,
    });
  }
});

orderWorker.on('error', (err) => {
  console.error('Worker error:', err);
});
