import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const STATIC_DIR = path.join(ROOT_DIR, 'dist');
const PORT = Number(process.env.FRONTEND_PORT || 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, headers);
  res.end(body);
};

const serveFile = async (res, filePath) => {
  const resolved = path.resolve(filePath);
  const staticRoot = path.resolve(STATIC_DIR);

  if (!resolved.startsWith(staticRoot) || path.basename(resolved).startsWith('.')) {
    return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  try {
    const fileStat = await stat(resolved);
    if (!fileStat.isFile()) throw new Error('Not a file');
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    });
    createReadStream(resolved).on('error', () => res.destroy()).pipe(res);
    return undefined;
  } catch {
    return null;
  }
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname.startsWith('/api')) {
    return send(res, 404, 'API is served by the backend process', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  if (url.pathname.includes('..') || /(^|\/)\.[^/]+/.test(url.pathname)) {
    return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  const requestedPath = decodeURIComponent(url.pathname);
  const assetPath = path.join(STATIC_DIR, requestedPath === '/' ? 'index.html' : requestedPath);
  const served = await serveFile(res, assetPath);
  if (served !== null) return undefined;

  try {
    await access(path.join(STATIC_DIR, 'index.html'));
    return serveFile(res, path.join(STATIC_DIR, 'index.html'));
  } catch {
    return send(res, 503, 'Frontend build not found. Run npm run build.', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`JNTUGV admissions frontend running at http://127.0.0.1:${PORT}`);
});
