import { defineConfig } from 'vite';
import assetsSplit from '../src/index';

export default defineConfig({
  plugins: [
    assetsSplit({
      limit: 200 // 200 bytes limit to force multiple chunks for our small test file
    }),
  ],
});
