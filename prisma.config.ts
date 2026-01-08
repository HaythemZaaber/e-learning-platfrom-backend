import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // url: env('DATABASE_URL'),
    url: 'postgresql://postgres:postgres@localhost:5432/ELearningDB?schema=public',
  },
});
