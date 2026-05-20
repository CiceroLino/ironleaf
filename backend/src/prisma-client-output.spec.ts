import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Prisma client output', () => {
  const rootDir = join(__dirname, '..');

  it('generates Prisma Client into node_modules and imports @prisma/client', () => {
    const schema = readFileSync(
      join(rootDir, 'prisma/schema.prisma'),
      'utf8',
    );
    const prismaService = readFileSync(
      join(rootDir, 'src/prisma/prisma.service.ts'),
      'utf8',
    );
    const discountService = readFileSync(
      join(rootDir, 'src/discount-codes/discount-codes.service.ts'),
      'utf8',
    );
    const discountDto = readFileSync(
      join(rootDir, 'src/discount-codes/dto/create-discount-code.dto.ts'),
      'utf8',
    );

    expect(schema).toContain('provider = "prisma-client-js"');
    expect(schema).not.toContain('../generated/prisma');
    expect(prismaService).toContain("from '@prisma/client'");
    expect(discountService).toContain("from '@prisma/client'");
    expect(discountDto).toContain("from '@prisma/client'");
  });
});
