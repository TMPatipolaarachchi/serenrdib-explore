/**
 * Database seed — run with `npm run db:seed`.
 *
 * Creates (idempotently):
 *   1. The initial admin account (username "admin", password "admin@123").
 *      The password is stored as a bcrypt hash and must be changed on first login.
 *      Re-running the seed never resets an existing admin's password.
 *   2. Categories, brands and models.
 *   3. Default site settings.
 *   4. Optional demo users/ads when SEED_DEMO_DATA="true".
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORY_SEED } from "./data/categories";
import { BRAND_SEED } from "./data/brands";
import { slugify, adSlug } from "../src/lib/slug";
import { DISTRICTS, citySlug } from "../src/lib/data/locations";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function seedAdmin() {
  const existing = await prisma.admin.findUnique({ where: { username: "admin" } });
  if (existing) {
    console.log("• Admin account already exists — password left unchanged.");
    return;
  }
  await prisma.admin.create({
    data: {
      username: "admin",
      passwordHash: await bcrypt.hash("admin@123", 12),
      mustChangePassword: true,
    },
  });
  console.log('✓ Created admin account (username "admin"). You will be asked to change the password on first login.');
}

async function seedCategories() {
  let order = 0;
  for (const cat of CATEGORY_SEED) {
    const { children, ...data } = cat;
    const parent = await prisma.category.upsert({
      where: { slug: data.slug },
      update: {},
      create: { ...data, sortOrder: order++ },
    });
    let childOrder = 0;
    for (const child of children ?? []) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: { ...child, type: cat.type, parentId: parent.id, sortOrder: childOrder++ },
      });
    }
  }
  console.log(`✓ Seeded ${await prisma.category.count()} categories.`);
}

async function seedBrands() {
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryId = new Map(categories.map((c) => [c.slug, c.id]));

  for (const [categorySlug, brands] of Object.entries(BRAND_SEED)) {
    const catId = categoryId.get(categorySlug);
    if (!catId) continue;

    for (const { name, models } of brands) {
      const brand = await prisma.brand.upsert({
        where: { slug: slugify(name) },
        update: { categories: { connect: { id: catId } } },
        create: { name, slug: slugify(name), categories: { connect: { id: catId } } },
      });
      for (const modelName of models) {
        const slug = slugify(modelName);
        // A model may be listed under two categories (e.g. Toyota Raize) — first one wins.
        await prisma.vehicleModel.upsert({
          where: { brandId_slug: { brandId: brand.id, slug } },
          update: {},
          create: { name: modelName, slug, brandId: brand.id, categoryId: catId },
        });
      }
    }
  }
  console.log(`✓ Seeded ${await prisma.brand.count()} brands and ${await prisma.vehicleModel.count()} models.`);
}

async function seedSettings() {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: "Riya.lk",
      tagline: "Sri Lanka's vehicle marketplace",
      contactEmail: "hello@riya.lk",
      contactPhone: "+94 11 234 5678",
      whatsappNumber: "+94771234567",
      address: "Colombo, Sri Lanka",
    },
  });
  console.log("✓ Seeded site settings.");
}

/** A handful of realistic sample ads so the homepage isn't empty during development. */
async function seedDemoData() {
  if (process.env.SEED_DEMO_DATA !== "true") return;
  if (await prisma.ad.count()) {
    console.log("• Ads already exist — skipping demo data.");
    return;
  }

  const seller = await prisma.user.upsert({
    where: { email: "demo@riya.lk" },
    update: {},
    create: {
      name: "Demo Seller",
      email: "demo@riya.lk",
      passwordHash: await bcrypt.hash("demo12345", 12),
      phone: "+94771234567",
      phoneVerifiedAt: new Date(),
      district: "colombo",
      city: "nugegoda",
    },
  });

  const cat = async (slug: string) => (await prisma.category.findUniqueOrThrow({ where: { slug } })).id;
  const brand = async (slug: string) => (await prisma.brand.findUnique({ where: { slug } }))?.id ?? null;
  const model = async (brandSlug: string, modelSlug: string) => {
    const b = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!b) return null;
    return (await prisma.vehicleModel.findUnique({ where: { brandId_slug: { brandId: b.id, slug: modelSlug } } }))?.id ?? null;
  };
  const randomCity = (district: string) => {
    const d = DISTRICTS.find((x) => x.slug === district)!;
    return citySlug(d.cities[Math.floor(Math.random() * d.cities.length)]);
  };

  const demoAds = [
    { title: "Toyota Aqua G 2015 – Excellent Condition", category: "cars", brand: "toyota", model: "aqua", price: 6_850_000, year: 2015, mileage: 92_000, fuelType: "HYBRID", transmission: "AUTOMATIC", engineCapacity: 1500, condition: "USED", district: "colombo", featured: true, top: true },
    { title: "Honda Vezel Z 2018 Hybrid", category: "suvs-jeeps", brand: "honda", model: "vezel", price: 11_900_000, year: 2018, mileage: 54_000, fuelType: "HYBRID", transmission: "AUTOMATIC", engineCapacity: 1500, condition: "USED", district: "gampaha", featured: true },
    { title: "Suzuki Wagon R Stingray 2017", category: "cars", brand: "suzuki", model: "wagon-r", price: 5_450_000, year: 2017, mileage: 61_000, fuelType: "HYBRID", transmission: "AUTOMATIC", engineCapacity: 660, condition: "USED", district: "kandy" },
    { title: "Bajaj RE 4 Stroke Three-wheeler 2019", category: "three-wheelers", brand: "bajaj", model: "re-4-stroke", price: 1_950_000, year: 2019, mileage: 48_000, fuelType: "PETROL", transmission: "MANUAL", engineCapacity: 200, condition: "USED", district: "kurunegala", featured: true },
    { title: "Yamaha FZ-S V3 2021 – Single Owner", category: "motorbikes", brand: "yamaha", model: "fz-s", price: 875_000, year: 2021, mileage: 12_500, fuelType: "PETROL", transmission: "MANUAL", engineCapacity: 150, condition: "USED", district: "galle" },
    { title: "Honda Dio 2022 Brand New Condition", category: "motorbikes", brand: "honda", model: "dio", price: 690_000, year: 2022, mileage: 4_300, fuelType: "PETROL", transmission: "AUTOMATIC", engineCapacity: 110, condition: "USED", district: "matara", negotiable: true },
    { title: "Toyota KDH HiAce Super GL 2014", category: "vans", brand: "toyota", model: "kdh", price: 13_500_000, year: 2014, mileage: 180_000, fuelType: "DIESEL", transmission: "AUTOMATIC", engineCapacity: 3000, condition: "USED", district: "colombo", featured: true },
    { title: "Isuzu Elf 2016 Freezer Lorry", category: "lorries", brand: "isuzu", model: "elf", price: 9_200_000, year: 2016, mileage: 210_000, fuelType: "DIESEL", transmission: "MANUAL", engineCapacity: 4000, condition: "USED", district: "anuradhapura", negotiable: true },
    { title: "Nissan Leaf 2018 40kWh – 92% Battery Health", category: "cars", brand: "nissan", model: "leaf", price: 7_600_000, year: 2018, mileage: 38_000, fuelType: "ELECTRIC", transmission: "AUTOMATIC", condition: "RECONDITIONED", district: "colombo", top: true },
    { title: "Mitsubishi Montero Sport 2012", category: "suvs-jeeps", brand: "mitsubishi", model: "montero-sport", price: 14_750_000, year: 2012, mileage: 145_000, fuelType: "DIESEL", transmission: "AUTOMATIC", engineCapacity: 2500, condition: "USED", district: "badulla" },
    { title: "Toyota Axio Headlight Set (2012–2015)", category: "lights", brand: "toyota", model: "axio", price: 38_500, condition: "USED", district: "gampaha", negotiable: true, partNumber: "81150-12D30", compatibility: "Fits Axio / Fielder NZE161, NKE165 (2012–2015)" },
    { title: "Brand New Dunlop 185/65 R15 Tyres (Set of 4)", category: "tyres-wheels", brand: "toyota", price: 96_000, condition: "NEW", district: "colombo", featured: true, compatibility: "Fits Premio, Allion, Axio, Vezel and similar" },
    { title: "Giant Talon 29er Mountain Bike", category: "bicycles", brand: "giant", model: "talon", price: 185_000, year: 2023, condition: "USED", district: "kandy" },
    { title: "Rent a Car – Wedding & Tour Hires Islandwide", category: "rent-a-car", price: 12_000, condition: null, district: "colombo", negotiable: true },
    { title: "JCB 3DX Backhoe Loader 2017", category: "heavy-vehicles", brand: "jcb", model: "3dx", price: 21_500_000, year: 2017, mileage: 6_800, fuelType: "DIESEL", transmission: "MANUAL", condition: "USED", district: "ratnapura" },
    { title: "Pioneer Android Car Setup 9\" with Reverse Camera", category: "audio-electronics", price: 32_000, condition: "NEW", district: "colombo" },
  ] as const;

  let hoursAgo = 1;
  for (const a of demoAds) {
    const publishedAt = new Date(Date.now() - hoursAgo++ * 3 * 60 * 60 * 1000);
    await prisma.ad.create({
      data: {
        slug: adSlug(a.title),
        title: a.title,
        description:
          `${a.title}.\n\nWell maintained and ready to use. Genuine buyers are welcome to inspect.\n` +
          "• All documents clear\n• Serious inquiries only\n\nCall or WhatsApp for more details.",
        price: a.price,
        negotiable: "negotiable" in a ? a.negotiable : false,
        condition: a.condition ?? null,
        categoryId: await cat(a.category),
        brandId: "brand" in a ? await brand(a.brand) : null,
        modelId: "model" in a ? await model(a.brand, a.model) : null,
        year: "year" in a ? a.year : null,
        mileage: "mileage" in a ? a.mileage : null,
        fuelType: "fuelType" in a ? a.fuelType : null,
        transmission: "transmission" in a ? a.transmission : null,
        engineCapacity: "engineCapacity" in a ? a.engineCapacity : null,
        partNumber: "partNumber" in a ? a.partNumber : null,
        compatibility: "compatibility" in a ? a.compatibility : null,
        district: a.district,
        city: randomCity(a.district),
        contactName: seller.name,
        contactPhone: seller.phone!,
        status: "ACTIVE",
        isFeatured: "featured" in a ? a.featured : false,
        isTopAd: "top" in a ? a.top : false,
        views: Math.floor(Math.random() * 900) + 20,
        userId: seller.id,
        publishedAt,
        createdAt: publishedAt,
      },
    });
  }
  console.log(`✓ Seeded demo user (demo@riya.lk / demo12345) and ${demoAds.length} demo ads.`);
}

async function main() {
  await seedAdmin();
  await seedCategories();
  await seedBrands();
  await seedSettings();
  await seedDemoData();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
