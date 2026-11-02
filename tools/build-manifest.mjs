// Builds asset-manifest.json (list of every file the game needs, with size + hash)
// and stamps the same version into sw.js. Run before serving or committing:
//   node tools/build-manifest.mjs
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const INCLUDE = ['index.html', 'css', 'src', 'vendor', 'assets'];
const IGNORE = /(^|\/)(\.|LICENSE|.*\.txt$|.*\.md$)/;

function walk(path, out) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const name of readdirSync(path).sort()) walk(join(path, name), out);
  } else {
    const url = relative(ROOT, path).split(sep).join('/');
    if (!IGNORE.test(url)) out.push(url);
  }
  return out;
}

const files = INCLUDE.flatMap((p) => walk(join(ROOT, p), [])).map((url) => {
  const buf = readFileSync(join(ROOT, url));
  return { url, size: buf.length, hash: createHash('sha1').update(buf).digest('hex').slice(0, 12) };
});

// Biggest first so the progress bar starts moving on the heavy files.
files.sort((a, b) => b.size - a.size);

const version = createHash('sha1')
  .update(files.map((f) => f.url + f.hash).join('|'))
  .digest('hex')
  .slice(0, 10);

writeFileSync(join(ROOT, 'asset-manifest.json'), JSON.stringify({ version, files }, null, 1) + '\n');

const swPath = join(ROOT, 'sw.js');
const sw = readFileSync(swPath, 'utf8');
const next = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`);
if (next !== sw) writeFileSync(swPath, next);

const total = files.reduce((s, f) => s + f.size, 0);
console.log(`Manifest ${version}: ${files.length} files, ${(total / 1024).toFixed(0)} KB`);
