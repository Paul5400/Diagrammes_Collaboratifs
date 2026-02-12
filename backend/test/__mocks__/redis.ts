// Mock pour la librairie redis utilisée dans les tests
export const createClient = jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
}));

export type RedisClientType = ReturnType<typeof createClient>;
