import path from 'node:path';
import { defineConfig } from 'vitest/config';

/** Config aislada: sin plugin Cloudflare para evitar escaneo del Worker en tests unitarios. */
export default defineConfig({
  resolve: {
    alias: {
      'cloudflare:workers': path.resolve(__dirname, 'src/api/test-utils/cloudflare-workers-env-mock.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
    pool: 'forks',
  },
});
