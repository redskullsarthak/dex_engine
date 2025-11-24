

type OrderStatus = 'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';


type OrderType ='market';//for now


export interface Order {
  id: string;
  type: 'market';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippageBps?: number;
  status: OrderStatus;
  chosenDex?: 'raydium' | 'meteora';
  executedPrice?: number;
  txHash?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}