import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // MikroORM resolves `entitiesTs` with a native dynamic import, outside
    // Vite's transform graph. Without a TypeScript loader in the worker,
    // Node's type stripping rejects the legacy decorators of `*.entity.ts`.
    pool: 'forks',
    execArgv: ['--import', '@swc-node/register/esm-register'],
  },
});
