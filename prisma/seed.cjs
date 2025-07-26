const { PrismaClient } = require("../lib/generated/prisma-client")
const db = new PrismaClient()

async function main() {
  const builtIn = [
    { slug: "corporate-wears", name: "Corporate Wears",  description: "Professional outfits for the workplace." },
    { slug: "african-prints",   name: "African Prints",   description: "Traditional and modern African print styles." },
    { slug: "casual-looks",     name: "Casual Looks",     description: "Everyday outfits for comfort and style." },
    { slug: "i-have-an-event",  name: "I Have an Event",  description: "Dress to impress for any occasion." },
  ]

  for (const cat of builtIn) {
    await db.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  console.log("✅ Seeded built‑in categories")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
