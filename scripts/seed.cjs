// prisma/seed.cjs
/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require("../lib/generated/prisma-client");
const db = new PrismaClient();

async function main() {
  // ── Categories (dynamic; initial four) ─────────────────────────
  const initialCategories = [
    {
      slug: "corporate-wears",
      name: "Corporate Wears",
      description: "Professional outfits for the workplace.",
      sortOrder: 1,
      isActive: true,
    },
    {
      slug: "african-prints",
      name: "African Prints",
      description: "Traditional and modern African print styles.",
      sortOrder: 2,
      isActive: true,
    },
    {
      slug: "casual-looks",
      name: "Casual Looks",
      description: "Everyday outfits for comfort and style.",
      sortOrder: 3,
      isActive: true,
    },
    {
      slug: "i-have-an-event",
      name: "I Have an Event",
      description: "Dress to impress for any occasion.",
      sortOrder: 4,
      isActive: true,
    },
  ];

  for (const cat of initialCategories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
      },
      create: cat,
    });
  }
  console.log("✅ Seeded initial categories");

  // ── Delivery Options (no pickup) ───────────────────────────────
  // Local: FIXED fee (example NGN 1500); International: EXTERNAL (quote from provider)
  const deliveryOptions = [
    {
      id: "local-courier",
      name: "Local Courier",
      provider: "LocalCourier",
      pricingMode: "FIXED",
      baseFee: 1500,
      baseCurrency: "NGN",
      active: true,
      metadata: {
        coverage: "Within Nigeria",
        estimatedDeliveryDays: 1,
      },
    },
    {
      id: "intl-courier",
      name: "International Courier",
      provider: process.env.DEFAULT_INTL_PROVIDER || "DHL",
      pricingMode: "EXTERNAL",
      baseFee: null,
      baseCurrency: null,
      active: true,
      metadata: {
        note: "Quoted dynamically via provider API at checkout",
        providersAllowed: ["DHL", "FedEx"],
      },
    },
  ];

  for (const opt of deliveryOptions) {
    await db.deliveryOption.upsert({
      where: { id: opt.id },
      update: {
        name: opt.name,
        provider: opt.provider,
        pricingMode: opt.pricingMode,
        baseFee: opt.baseFee,
        baseCurrency: opt.baseCurrency,
        active: opt.active,
        metadata: opt.metadata,
      },
      create: opt,
    });
  }
  console.log("✅ Seeded delivery options");
 
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
