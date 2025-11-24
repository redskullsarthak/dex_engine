import * as Types from "./types";
const sleep = (ms: number) =>new Promise(resolve => setTimeout(resolve, ms));
export class DexEngine{

RaydiumMock = async (order: Types.Order): Promise<Types.Quote> => {
  await sleep(300);
  const basePrice = order.amountIn;
  const quoteVal = basePrice * (0.98 + Math.random() * 0.04); 
  return { dex: 'raydium', quoteVal, fee: 0.003 };
};
MeteoraMock = async (order: Types.Order): Promise<Types.Quote> => {
  await sleep(300);
  const basePrice = order.amountIn;
  const quoteVal = basePrice * (0.97 + Math.random() * 0.05); 
  return { dex: 'meteora', quoteVal, fee: 0.004 };
};

Execute = async (order: Types.Order,quote: Types.Quote) => {
  await sleep(2000 + Math.random() * 1000);
  if (Math.random() < 0.1) {
    throw new Error(`Mock ${quote.dex} execution failed: network timeout`); // some kind of error may occur to simulate that
  }
  const grossOut = order.amountIn * quote.quoteVal;
  const feeAmount = grossOut * quote.fee;
  const amountOut = grossOut - feeAmount;

  // slippage protection
  if (order.slippageBps != null) {
    const maxSlippage = order.slippageBps / 10_000;
    const minAllowedOut = grossOut * (1 - maxSlippage);
    if (amountOut < minAllowedOut) {
      throw new Error('Slippage exceeded allowed tolerance');
    }
  }

  const txHash =
    'MOCK_' +quote.dex.toUpperCase() +'_' +Math.random().toString(16).slice(2) +'_' +Date.now().toString(16);
  return {
    dex: quote.dex,
    txHash,
    executedPrice: quote.quoteVal,
    amountIn: order.amountIn,
    amountOut,
    feePaid: feeAmount,
  };
};

};