import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('SWC configuration', () => {
  const rootDir = join(__dirname, '..');

  it('uses SWC for Nest builds and Jest transforms', () => {
    const nestCli = JSON.parse(
      readFileSync(join(rootDir, 'nest-cli.json'), 'utf8'),
    );
    const swcrc = JSON.parse(readFileSync(join(rootDir, '.swcrc'), 'utf8'));
    const packageJson = JSON.parse(
      readFileSync(join(rootDir, 'package.json'), 'utf8'),
    );

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
});
