import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('exposes campaign persistence through the generated client', () => {
    const prisma = new PrismaService();

    expect(prisma.campaign).toBeDefined();
  });
});
