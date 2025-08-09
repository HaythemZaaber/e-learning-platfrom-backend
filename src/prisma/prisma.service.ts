import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Add middleware to convert ALL null values to undefined globally
    this.$use(
      async (
        params: any,
        next: (params: any) => Promise<any>,
      ) => {
        const result = await next(params);

        // Apply conversion to all database operations
        if (result) {
          return this.convertNullsToUndefined(result);
        }

        return result;
      },
    );
  }

  private convertNullsToUndefined<T>(obj: T): T {
    if (obj === null) return undefined as T;
    if (obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertNullsToUndefined(item)) as T;
    }

    if (typeof obj === 'object' && obj !== null) {
      const result = {} as T;
      for (const [key, value] of Object.entries(obj)) {
        (result as any)[key] = this.convertNullsToUndefined(value);
      }
      return result;
    }

    return obj;
  }
}
