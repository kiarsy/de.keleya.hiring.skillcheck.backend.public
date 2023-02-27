export const mockPrisma = {
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  $executeRaw: jest.fn(),
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  credentials: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};
