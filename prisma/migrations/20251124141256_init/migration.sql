-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'market',
    "tokenIn" TEXT NOT NULL,
    "tokenOut" TEXT NOT NULL,
    "amountIn" REAL NOT NULL,
    "slippageBps" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "chosenDex" TEXT,
    "executedPrice" REAL,
    "txHash" TEXT,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
