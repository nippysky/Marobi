// prisma.config.ts
import { defineConfig } from "prisma";

export default defineConfig({
  schemaPath: "prisma/schema.prisma",
  // tell Prisma how to seed your database
  seed: {
    run: "node prisma/seed.cjs",
  },
});
