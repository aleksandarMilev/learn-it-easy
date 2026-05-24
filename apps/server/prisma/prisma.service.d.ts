import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly client;
    constructor();
    get db(): PrismaClient;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=prisma.service.d.ts.map