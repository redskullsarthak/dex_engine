// server/index.ts (or wherever your server code lives)
import Fastify from "fastify";
import * as Types from '../cores/types';
import { DexEngine} from "../cores/mockDexEngine";
import { InMemoryOrders } from "../routes/orders";
import { sendStatus } from "./statusPublisher";
export const fastify = Fastify({
  logger: true
});


export const makeId = () =>
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);

export const getOrderById = (orderId: string): Types.Order | undefined => {
  return InMemoryOrders.find((o) => o.id === orderId);
};

export const pickBestQuote = (order: Types.Order, raydium: Types.Quote, meteora: Types.Quote) => {
  const outRaydium = order.amountIn * raydium.quoteVal * (1 - raydium.fee);
  const outMeteora = order.amountIn * meteora.quoteVal * (1 - meteora.fee);

  if (outRaydium >= outMeteora) {
    return {
      best: raydium,
      chosenDex: 'raydium' as const,
      outRaydium,
      outMeteora,
    };
  } else {
    return {
      best: meteora,
      chosenDex: 'meteora' as const,
      outRaydium,
      outMeteora,
    };
  }
};
export const worker = async (orderId: string) => {
  const order = getOrderById(orderId);
  if (!order) {
    fastify.log.error({ orderId }, 'order not found in memory');
    return;
  }

  const dex = new DexEngine();

  try {
    sendStatus(orderId, "pending");
    sendStatus(orderId, "routing");
    const [raydium, meteora] = await Promise.all([
      dex.RaydiumMock(order),
      dex.MeteoraMock(order),
    ]);

    const { best, chosenDex, outRaydium, outMeteora } = pickBestQuote(order, raydium, meteora);

    sendStatus(orderId, "building", {
      chosenDex,
      raydiumQuote: raydium,
      meteoraQuote: meteora,
      outRaydium,
      outMeteora,
    });
    sendStatus(orderId, "submitted", { chosenDex });
    const execResult = await dex.Execute(order, best);
    sendStatus(orderId, "confirmed", {
      dex: execResult.dex,
      txHash: execResult.txHash,
      executedPrice: execResult.executedPrice,
      amountOut: execResult.amountOut,
      feePaid: execResult.feePaid,
    });

  } catch (err: any) {
    sendStatus(orderId, "failed", {
      error: err?.message ?? 'Unknown error',
    });
  }
};