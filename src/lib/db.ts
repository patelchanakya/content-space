// INTRO TO FILE Starting Documentation for Onboarding Process
//
// This file manages the Prisma client instance for server use.
// The PrismaClient from '@prisma/client' is used for database interactions.
// To minimize performance overhead during development due to hot reloading,
// a caching mechanism for the PrismaClient instance is implemented.
// 
// The 'cachedPrisma' global variable stores the PrismaClient instance.
// During development, before creating a new instance, it checks if 'cachedPrisma' exists.
// If it exists, it reuses it, avoiding multiple instances across reloads.
// In production, a new PrismaClient instance is created for each server start.
// 
// This ensures efficient resource use during development and reliable database connections in production.



import { PrismaClient } from '@prisma/client';
import 'server-only';

declare global {
    // eslint-disable-next-line no-var, no-unused-vars
    var cachedPrisma: PrismaClient;
}

export let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    if (!global.cachedPrisma) {
        global.cachedPrisma = new PrismaClient();
    }
    prisma = global.cachedPrisma;
}
