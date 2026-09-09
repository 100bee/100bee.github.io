import { cp, mkdir, rm, access } from 'node:fs/promises';

// Keep the source directly compatible with GitHub Pages. The deployment build
// only copies public files and never includes Git metadata or private settings.
const publicFiles = ['index.html', 'styles.css', 'script.js', 'itpt-demo', 'chronote-demo'];
for (const file of publicFiles) await access(file);
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of publicFiles) await cp(file, `dist/${file}`, { recursive: true });
console.log('Static portfolio built in dist/. Chronote preview included.');
