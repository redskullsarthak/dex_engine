// server/index.ts (or wherever your server code lives)
import Fastify from "fastify";
import * as Types from '../cores/types';
import { DexEngine} from "../cores/mockDexEngine";
import { prisma } from "../db";
import { sendStatus } from "./statusPublisher";
export const fastify = Fastify({
  logger: true
});


export const makeId = () =>
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);

export const getOrderById = async (orderId: string): Promise<any | null> => {
  return await prisma.order.findUnique({ where: { id: orderId } });
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
  const order = await getOrderById(orderId);
  if (!order) {
    fastify.log.error({ orderId }, 'order not found in database');
    return;
  }

  const dex = new DexEngine();

  try {
    await sendStatus(orderId, "pending");
    await sendStatus(orderId, "routing");
    const [raydium, meteora] = await Promise.all([
      dex.RaydiumMock(order),
      dex.MeteoraMock(order),
    ]);

    const { best, chosenDex, outRaydium, outMeteora } = pickBestQuote(order, raydium, meteora);

    await sendStatus(orderId, "building", {
      chosenDex,
      raydiumQuote: raydium,
      meteoraQuote: meteora,
      outRaydium,
      outMeteora,
    });
    await sendStatus(orderId, "submitted", { chosenDex });
    const execResult = await dex.Execute(order, best);
    await sendStatus(orderId, "confirmed", {
      dex: execResult.dex,
      txHash: execResult.txHash,
      executedPrice: execResult.executedPrice,
      amountOut: execResult.amountOut,
      feePaid: execResult.feePaid,
    });

  } catch (err: any) {
    await sendStatus(orderId, "failed", {
      error: err?.message ?? 'Unknown error',
    });
  }
};