// Tiny static server for local play/testing (no dependencies).
//   node tools/serve.mjs [--port 8080] [--open] [--slow]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { networkInterfaces } from 'node:os';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
let port = Number(args[args.indexOf('--port') + 1]) || 8080;
const open = args.includes('--open');
const slow = args.includes('--slow');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) throw Object.assign(new Error('forbidden'), { code: 'EACCES' });
    const st = await stat(file);
    if (!st.isFile()) throw Object.assign(new Error('not a file'), { code: 'ENOENT' });
    // Revalidation with ETag lets the browser reuse files the loader already downloaded.
    const etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' });
      return res.end();
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
      ETag: etag,
    });
    if (!slow) return res.end(body);
    // --slow: simulate a weak connection (~160 KB/s) to test the loading screen.
    for (let i = 0; i < body.length; i += 16384) {
      res.write(body.subarray(i, i + 16384));
      await new Promise((r) => setTimeout(r, 100));
    }
    res.end();
  } catch (e) {
    res.writeHead(e.code === 'EACCES' ? 403 : 404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && port < 8100) {
    port++;
    server.listen(port, '0.0.0.0');
  } else {
    console.error(e.message);
    process.exit(1);
  }
});

// Home Wi-Fi addresses usually start with 192.168, so list those first.
const rank = (ip) => (ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : 2);

server.on('listening', () => {
  const local = `http://localhost:${port}`;
  const lan = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address)
    .sort((a, b) => rank(a) - rank(b))
    .map((ip) => `http://${ip}:${port}`);
  console.log('\n  BODY QUEST is running!\n');
  console.log(`  On this computer:  ${local}`);
  for (const url of lan) console.log(`  On your phone (same Wi-Fi):  ${url}`);
  console.log('\n  Close this window to stop the game server.\n');
  if (open) exec(process.platform === 'win32' ? `start "" "${local}"` : `open "${local}"`);
});

server.listen(port, '0.0.0.0');
