import { orderMap } from '../routes/orders';

export const sendStatus = (orderId: string, status: string, extra: Record<string, any> = {}) => {
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
