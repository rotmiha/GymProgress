import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Keep generated dependencies outside OneDrive and separate for each checkout.
const projectId = createHash('sha256')
  .update(import.meta.url)
  .digest('hex')
  .slice(0, 12);

export default defineConfig({
  cacheDir: join(tmpdir(), 'gymprogress-vite', projectId),
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
});
