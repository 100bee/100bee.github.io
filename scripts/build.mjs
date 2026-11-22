import { cp, mkdir, rm, access, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, extname, join, relative } from 'node:path';

// GitHub Pages serves the repository root. Generate content-addressed asset
// names in assets/, rewrite each page's references, then copy the same public
// files to dist for local/static builds. Earlier asset versions are retained so a
// cached HTML document still has its styles.
//
// Pages:
//   index.html     — v2 (gravity scene)
//   v1/index.html  — previous portfolio, kept as an archive
const pages = [
  { html: 'index.html', sources: ['gravity.css', 'gravity.js'] },
  { html: 'v1/index.html', sources: ['v1/portfolio.css', 'v1/navigation.js', 'v1/hero.css', 'v1/hero-motion.js', 'v1/cursor-build.css', 'v1/cursor-build.js'] },
];

await mkdir('assets', { recursive: true });
for (const page of pages) {
  let html = await readFile(page.html, 'utf8');
  const toRoot = relative(dirname(page.html), '.') || '.';
  for (const file of page.sources) {
    const content = await readFile(file);
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
    const extension = extname(file);
    const stem = basename(file, extension);
    const output = 'assets/' + stem + '.' + hash + extension;
    await writeFile(output, content);
    const ref = (toRoot === '.' ? './' : toRoot + '/') + output;
    const previous = new RegExp('(^|/)assets/' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.[0-9a-f]{12}' + extension.replace('.', '\\.') + '$');
    let found = false;
    html = html.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, url) => {
      const clean = url.split('?')[0];
      const isSource = clean === './' + basename(file) || clean === basename(file);
      if (!isSource && !previous.test(clean)) return match;
      found = true;
      return attribute + '="' + ref + '"';
    });
    if (!found) throw new Error('Missing HTML reference for ' + file + ' in ' + page.html);
  }
  await writeFile(page.html, html);
}

const publicFiles = ['index.html', 'styles.css', 'script.js', 'assets', 'itpt-demo', 'chronote-demo', 'christmas', 'v1/index.html'];
for (const file of publicFiles) await access(file);
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of publicFiles) await cp(file, join('dist', file), { recursive: true });
console.log('Static portfolio built (v2 + v1 archive). Versioned assets and legacy cached-page assets included.');
