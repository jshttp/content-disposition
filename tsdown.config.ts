import { defineConfig } from 'tsdown';

export default defineConfig({
  platform: 'neutral',
  format: {
    esm: { target: ['es2022'] },
    cjs: {}, // No target needed -> tsdown will infer from package.json "engines" field
  },
  dts: true,
  exports: true,

  /* Package Validation: https://tsdown.dev/options/lint */
  attw: true,
  publint: true,
});
