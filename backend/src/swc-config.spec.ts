import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type NestCliConfig = {
  compilerOptions: {
    builder: string;
    typeCheck: boolean;
  };
};

type SwcConfig = {
  jsc: {
    parser: {
      syntax: string;
      decorators: boolean;
      dynamicImport: boolean;
    };
    transform: {
      legacyDecorator: boolean;
      decoratorMetadata: boolean;
    };
  };
};

type PackageJson = {
  scripts: Record<string, string>;
  jest: {
    transform: Record<string, string[]>;
  };
};

function readJson<T>(path: string): T {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  return parsed as T;
}

describe('SWC configuration', () => {
  const rootDir = join(__dirname, '..');

  it('uses SWC for Nest builds and Jest transforms', () => {
    const nestCli = readJson<NestCliConfig>(join(rootDir, 'nest-cli.json'));
    const swcrc = readJson<SwcConfig>(join(rootDir, '.swcrc'));
    const packageJson = readJson<PackageJson>(join(rootDir, 'package.json'));

    expect(nestCli.compilerOptions).toEqual(
      expect.objectContaining({
        builder: 'swc',
        typeCheck: true,
      }),
    );
    expect(swcrc.jsc.parser).toEqual(
      expect.objectContaining({
        syntax: 'typescript',
        decorators: true,
        dynamicImport: true,
      }),
    );
    expect(swcrc.jsc.transform).toEqual(
      expect.objectContaining({
        legacyDecorator: true,
        decoratorMetadata: true,
      }),
    );
    expect(packageJson.jest.transform).toEqual({
      '^.+\\.(t|j)s$': ['@swc/jest'],
    });
  });

  it('wires a Prisma seed command for cold starts', () => {
    const packageJson = readJson<PackageJson>(join(rootDir, 'package.json'));
    const prismaConfig = readFileSync(
      join(rootDir, 'prisma.config.ts'),
      'utf8',
    );

    expect(packageJson.scripts['prisma:seed']).toBe('prisma db seed');
    expect(prismaConfig).toContain(
      "seed: 'ts-node --transpile-only prisma/seed.ts'",
    );
  });
});
