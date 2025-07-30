// prisma.config.js
/**
 * @type {import('prisma').PrismaConfig}
 */
module.exports = {
  schemaPath: "prisma/schema.prisma",
  seed: {
    run: "node prisma/seed.cjs",
  },
};
