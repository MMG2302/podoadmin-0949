import { defineConfig } from 'vitest/config';

/** Config aislada: sin plugin Cloudflare para evitar escaneo del Worker en tests unitarios. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
    pool: 'forks',
  },
});
