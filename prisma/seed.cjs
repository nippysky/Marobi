const { PrismaClient } = require("../lib/generated/prisma-client");
const db = new PrismaClient();

async function main() {
  // --- Categories ---
  const builtInCategories = [
    { slug: "corporate-wears", name: "Corporate Wears", description: "Professional outfits for the workplace." },
    { slug: "african-prints", name: "African Prints", description: "Traditional and modern African print styles." },
    { slug: "casual-looks", name: "Casual Looks", description: "Everyday outfits for comfort and style." },
    { slug: "i-have-an-event", name: "I Have an Event", description: "Dress to impress for any occasion." },
  ];

  for (const cat of builtInCategories) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Seeded built-in categories");

  // --- Delivery Options ---
  const deliveryOptions = [
    {
      id: "in-person-pickup",
      name: "In-Person / Walk-in Pickup",
      provider: null,
      type: "PICKUP",
      active: true,
      baseFee: 0,
      metadata: {
        notes: "Customer picks up at the physical store.",
      },
    },
    {
      id: "local-courier",
      name: "Local Courier",
      provider: "LocalCourier",
      type: "COURIER",
      active: true,
      baseFee: 1500,
      metadata: {
        currency: "NGN",
        estimatedDeliveryDays: 2,
        coverage: "Within Nigeria",
      },
    },
  ];

  for (const opt of deliveryOptions) {
    await db.deliveryOption.upsert({
      where: { id: opt.id },
      update: {
        name: opt.name,
        provider: opt.provider,
        type: opt.type,
        active: opt.active,
        baseFee: opt.baseFee,
        metadata: opt.metadata,
      },
      create: opt,
    });
  }
  console.log("✅ Seeded delivery options");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
