
import { z } from 'zod'

export const OrderStatus = z.enum([
  'pending',
  'routing',
  'building',
  'submitted',
  'confirmed',
  'failed',
] as const)

export const OrderType = z.enum(['market'] as const)

export const DexName = z.enum(['raydium', 'meteora'] as const)

export const Quote = z.object({ dex: DexName, quoteVal: z.number(), fee: z.number() })

export const OrderSchema = z.object({
  id: z.string(),
  type: OrderType,
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.number(),
  slippageBps: z.number().optional(),
  status: OrderStatus,
  chosenDex: DexName.optional(),
  executedPrice: z.number().optional(),
  txHash: z.string().optional(),
  failureReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Order = z.infer<typeof OrderSchema>
export type OrderStatus = z.infer<typeof OrderStatus>
export type OrderType = z.infer<typeof OrderType>
export type DexName = z.infer<typeof DexName>
export type Quote=z.infer<typeof Quote>
