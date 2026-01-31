# vite-plugin-assets-split

A Vite plugin to split large static assets into smaller chunks. This is useful for dealing with file size limitations on certain static hosting platforms (e.g., Cloudflare Pages, GitHub Pages limits).

## Features

- Import static files with `?split` query parameter.
- Automatically splits files into chunks based on a configurable size limit.
- Returns an array of URLs for the chunks.

## Installation

```bash
npm install vite-plugin-assets-split -D
# or
yarn add vite-plugin-assets-split -D
# or
pnpm add vite-plugin-assets-split -D
```

## Usage

### 1. Configure the plugin in `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import assetsSplit from 'vite-plugin-assets-split';

export default defineConfig({
  plugins: [
    assetsSplit({
      limit: 1024 * 1024 * 2, // Optional: Set chunk size limit (e.g., 2MB). Default is 1MB.
    }),
  ],
});
```

### 2. Import assets with `?split`

```typescript
// Import a large file. The result will be an array of strings (URLs).
import modelChunks from './large-model.glb?split';

console.log(modelChunks); 
// Output: ['/assets/large-model.part1.glb', '/assets/large-model.part2.glb', ...]

// Example: Loading a split file (pseudo-code)
async function loadSplitFile(urls: string[]) {
  const buffers = await Promise.all(urls.map(url => fetch(url).then(res => res.arrayBuffer())));
  // Combine buffers logic here...
}
```

## TypeScript Support

To get proper type inference for imports with `?split`, add the following to your `vite-env.d.ts` or a global declaration file:

```typescript
declare module '*?split' {
  const urls: string[];
  export default urls;
}
```

## License

MIT
