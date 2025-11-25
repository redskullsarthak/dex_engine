import { describe, it, expect } from 'vitest';
import { pickBestQuote } from '../cores/workers';
import * as Types from '../cores/types';

describe('Routing - pickBestQuote', () => {
  const mockOrder: Types.Order = {
    id: 'test-123',
    type: 'market',
    tokenIn: 'USDC',
    tokenOut: 'SOL',
    amountIn: 100,
    slippageBps: 50,
  };

  it('should pick Raydium when it has better output', () => {
    const raydium: Types.Quote = {
      dex: 'raydium',
      quoteVal: 1.05,
      fee: 0.003, // 0.3%
    };
    const meteora: Types.Quote = {
      dex: 'meteora',
      quoteVal: 1.02,
      fee: 0.003,
    };

    const result = pickBestQuote(mockOrder, raydium, meteora);

    expect(result.chosenDex).toBe('raydium');
    expect(result.best).toEqual(raydium);
    expect(result.outRaydium).toBeGreaterThan(result.outMeteora);
  });

  it('should pick Meteora when it has better output', () => {
    const raydium: Types.Quote = {
      dex: 'raydium',
      quoteVal: 1.00,
      fee: 0.005, // 0.5%
    };
    const meteora: Types.Quote = {
      dex: 'meteora',
      quoteVal: 1.03,
      fee: 0.002, // 0.2%
    };

    const result = pickBestQuote(mockOrder, raydium, meteora);

    expect(result.chosenDex).toBe('meteora');
    expect(result.best).toEqual(meteora);
    expect(result.outMeteora).toBeGreaterThan(result.outRaydium);
  });

  it('should pick Raydium when outputs are equal', () => {
    const raydium: Types.Quote = {
      dex: 'raydium',
      quoteVal: 1.05,
      fee: 0.003,
    };
    const meteora: Types.Quote = {
      dex: 'meteora',
      quoteVal: 1.05,
      fee: 0.003,
    };

    const result = pickBestQuote(mockOrder, raydium, meteora);

    expect(result.chosenDex).toBe('raydium');
    expect(result.outRaydium).toBe(result.outMeteora);
  });

  it('should correctly calculate output amounts with fees', () => {
    const raydium: Types.Quote = {
      dex: 'raydium',
      quoteVal: 2.0,
      fee: 0.01, // 1%
    };
    const meteora: Types.Quote = {
      dex: 'meteora',
      quoteVal: 1.5,
      fee: 0.005, // 0.5%
    };

    const result = pickBestQuote(mockOrder, raydium, meteora);

    // 100 * 2.0 * (1 - 0.01) = 198
    expect(result.outRaydium).toBe(198);
    // 100 * 1.5 * (1 - 0.005) = 149.25
    expect(result.outMeteora).toBe(149.25);
    expect(result.chosenDex).toBe('raydium');
  });

  it('should handle zero fee correctly', () => {
    const raydium: Types.Quote = {
      dex: 'raydium',
      quoteVal: 1.0,
      fee: 0,
    };
    const meteora: Types.Quote = {
      dex: 'meteora',
      quoteVal: 1.0,
      fee: 0,
    };

    const result = pickBestQuote(mockOrder, raydium, meteora);

    expect(result.outRaydium).toBe(100);
    expect(result.outMeteora).toBe(100);
  });

  it('should handle high fee correctly', () => {
    const raydium: Types.Quote = {
      dex: 'raydium',
      quoteVal: 2.0,
      fee: 0.5, // 50% fee
    };
    const meteora: Types.Quote = {
      dex: 'meteora',
      quoteVal: 1.5,
      fee: 0.1, // 10% fee
    };

    const result = pickBestQuote(mockOrder, raydium, meteora);

    // 100 * 2.0 * 0.5 = 100
    expect(result.outRaydium).toBe(100);
    // 100 * 1.5 * 0.9 = 135
    expect(result.outMeteora).toBe(135);
    expect(result.chosenDex).toBe('meteora');
  });
});
