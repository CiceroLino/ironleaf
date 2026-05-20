import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { DiscountType, PrismaClient } from '@prisma/client';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const paidSocial = await prisma.campaign.upsert({
    where: { name: 'Paid Social Launch' },
    update: {},
    create: { name: 'Paid Social Launch' },
  });
  const emailRetention = await prisma.campaign.upsert({
    where: { name: 'Email Retention' },
    update: {},
    create: { name: 'Email Retention' },
  });
  const blackFriday = await prisma.campaign.upsert({
    where: { name: 'Black Friday' },
    update: {},
    create: { name: 'Black Friday' },
  });

  await prisma.discountCode.upsert({
    where: { code: 'SOCIAL20' },
    update: {},
    create: {
      code: 'SOCIAL20',
      campaignId: paidSocial.id,
      discountType: DiscountType.PERCENT,
      discountValue: 20,
      expiresAt: new Date('2027-12-31T23:59:59.000Z'),
      usageLimit: 100,
    },
  });

  await prisma.discountCode.upsert({
    where: { code: 'EMAIL15' },
    update: {},
    create: {
      code: 'EMAIL15',
      campaignId: emailRetention.id,
      discountType: DiscountType.FIXED,
      discountValue: 15,
      currency: 'USD',
      expiresAt: new Date('2027-12-31T23:59:59.000Z'),
      usageLimit: 50,
    },
  });

  await prisma.discountCode.upsert({
    where: { code: 'BFVIP' },
    update: {},
    create: {
      code: 'BFVIP',
      campaignId: blackFriday.id,
      discountType: DiscountType.PERCENT,
      discountValue: 30,
      expiresAt: new Date('2024-12-31T23:59:59.000Z'),
      usageLimit: 2,
      redemptionCount: 1,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
