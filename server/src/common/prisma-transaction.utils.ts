import type { Prisma } from '@prisma/client';

import type { PrismaService } from '../prisma.service';

const SERIALIZABLE_TRANSACTION_MAX_ATTEMPTS = 3;

const isSerializableTransactionConflict = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034';

/**
 * Prisma surfaces a serialization failure as P2034. Re-running the whole callback is important:
 * callers must repeat their guards against the new database state before writing.
 */
export const runSerializableTransaction = async <T>(
  prisma: PrismaService,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> => {
  for (let attempt = 1; attempt <= SERIALIZABLE_TRANSACTION_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (
        !isSerializableTransactionConflict(error) ||
        attempt === SERIALIZABLE_TRANSACTION_MAX_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw new Error('Serializable transaction retry loop exhausted unexpectedly');
};
