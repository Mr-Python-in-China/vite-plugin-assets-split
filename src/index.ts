import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

export interface Options {
  /**
   * Maximum size of each chunk in bytes.
   * Default is 1MB (1024 * 1024 bytes).
   */
  limit?: number;
}

export function assetsSplit(options: Options = {}): Plugin {
  const limit = options.limit ?? 1024 * 1024; // 1MB default
  let config: ResolvedConfig;

  return {
    name: 'vite-plugin-assets-split',
    enforce: 'pre', // Ensure this runs before Vite's default asset handling

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlObj = new URL(req.url!, `http://${req.headers.host}`);
        if (urlObj.searchParams.has('split-chunk')) {
          try {
            const chunkIndex = parseInt(urlObj.searchParams.get('split-chunk')!, 10);
            let filePath: string;
            const pathname = urlObj.pathname;

            if (pathname.startsWith('/@fs/')) {
              // Absolute path handling
              filePath = pathname.slice(5);
              // Handle potentially weird windows paths if stripped poorly?
              // The browser request for /@fs/C:/... usually comes as /@fs/C:/... 
              // slice(5) -> C:/... which is valid for fs.readFile in node (even on windows usually)
            } else {
              // Relative path handling
              filePath = path.join(config.root, pathname);
            }

            filePath = decodeURIComponent(filePath);

            try {
              const buffer = await fs.readFile(filePath);
              const start = chunkIndex * limit;
              if (start >= buffer.length) {
                res.statusCode = 404;
                res.end('Chunk index out of bounds');
                return;
              }

              const end = Math.min(start + limit, buffer.length);
              const chunk = buffer.subarray(start, end);

              // Basic mime type - could be improved based on extension
              res.setHeader('Content-Type', 'application/octet-stream');
              res.setHeader('Content-Length', chunk.length);
              res.end(chunk);
            } catch (err) {
              // File not found or read error
              next(err);
            }
          } catch (e) {
             console.error('[vite-plugin-assets-split] Middleware error:', e);
             next(e);
          }
        } else {
          next();
        }
      });
    },

    async load(id) {
      if (!id.includes('?')) return null;

      const [filePath, query] = id.split('?');
      const params = new URLSearchParams(query);

      if (!params.has('split')) {
        return null;
      }

      try {
        const buffer = await fs.readFile(filePath);
        const totalSize = buffer.length;
        const chunkCount = Math.ceil(totalSize / limit);
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        
        const references: string[] = [];

        if (config.command === 'serve') {
          // Development mode: Return URLs that the middleware will intercept
          for (let i = 0; i < chunkCount; i++) {
            let urlPath: string;
            // Basic path resolution logic compatible with Vite's serving
            if (filePath.startsWith(config.root)) {
               urlPath = '/' + path.relative(config.root, filePath);
            } else {
               urlPath = '/@fs/' + filePath;
            }
            // Normalize slashes for URL
            urlPath = urlPath.split(path.sep).join('/');
            
            references.push(`${urlPath}?split-chunk=${i}`);
          }
          
          return `export default ${JSON.stringify(references)};`;

        } else {
          // Build mode: keep original logic using emitFile
          for (let i = 0; i < chunkCount; i++) {
            const start = i * limit;
            const end = Math.min(start + limit, totalSize);
            const chunk = buffer.subarray(start, end);
            
            const refId = this.emitFile({
              type: 'asset',
              name: `${nameWithoutExt}.part${i + 1}${ext}`,
              source: chunk,
            });
            
            references.push(refId);
          }
  
          const code = `export default [${references.map(ref => `import.meta.ROLLUP_FILE_URL_${ref}`).join(', ')}];`;
  
          return {
            code,
            map: null,
          };
        }
      } catch (error) {
        console.error(`[vite-plugin-assets-split] Error processing file ${filePath}:`, error);
        throw error;
      }
    }
  };
}

export default assetsSplit;
