import { cp, mkdir, rm, access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, extname } from 'node:path';

// GitHub Pages serves the repository root. Generate content-addressed asset
// names there, then copy the same public files to dist for local/static builds.
// Retain earlier asset versions so a cached HTML document still has its styles.
const sourceAssets = ['portfolio.css', 'navigation.js', 'hero.css', 'hero-motion.js'];
await mkdir('assets', { recursive: true });
let html = await readFile('index.html', 'utf8');
for (const file of sourceAssets) {
  const content = await readFile(file);
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const extension = extname(file);
  const stem = basename(file, extension);
  const output = 'assets/' + stem + '.' + hash + extension;
  await writeFile(output, content);
  let found = false;
  html = html.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, url) => {
    const clean = url.split('?')[0];
    const previousVersion = clean.startsWith('./assets/' + stem + '.') && clean.endsWith(extension);
    if (clean !== './' + file && !previousVersion) return match;
    found = true;
    return attribute + '="./' + output + '"';
  });
  if (!found) throw new Error('Missing HTML reference for ' + file);
}
await writeFile('index.html', html);

const publicFiles = ['index.html', 'styles.css', 'script.js', 'assets', 'itpt-demo', 'chronote-demo'];
for (const file of publicFiles) await access(file);
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of publicFiles) await cp(file, 'dist/' + file, { recursive: true });
console.log('Static portfolio built. Versioned assets and legacy cached-page assets included.');
