import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'style.css', 'src', 'game.contract.json']) {
  await cp(resolve(root, name), resolve(dist, name), { recursive: true });
}
await mkdir(resolve(dist, 'vendor'), { recursive: true });
for (const name of ['three.module.js', 'three.core.js']) {
  await cp(resolve(root, 'node_modules/three/build', name), resolve(dist, 'vendor', name));
}
await cp(resolve(root, 'node_modules/three/LICENSE'), resolve(dist, 'vendor/THREE-LICENSE.txt'));
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await writeFile(resolve(dist, 'version.json'), JSON.stringify({ name: manifest.name, version: manifest.version }) + '\n');
console.log('Built static game: dist/ (no runtime CDN or server-side dependency)');
