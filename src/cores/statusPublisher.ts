import { orderMap } from './orderMap';
import { prisma } from '../db';

export const sendStatus = async (orderId: string, status: string, extra: Record<string, any> = {}) => {
  // Update database
  const updateData: any = { status };
  if (extra.chosenDex) updateData.chosenDex = extra.chosenDex;
  if (extra.executedPrice !== undefined) updateData.executedPrice = extra.executedPrice;
  if (extra.txHash) updateData.txHash = extra.txHash;
  if (extra.error || extra.failureReason) updateData.failureReason = extra.error || extra.failureReason;
  
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
  } catch (err) {
    // log but continue to websocket
    console.error('Failed to update order in DB:', err);
  }

  // Send over websocket if connected
  const socket = orderMap.get(orderId);
  if (!socket) return;

  const payload = JSON.stringify({
    orderId,
    status,
    ...extra,
  });

  try {
    socket.send(payload);
  } catch (err) {
    // ignore send errors for now
  }
};
