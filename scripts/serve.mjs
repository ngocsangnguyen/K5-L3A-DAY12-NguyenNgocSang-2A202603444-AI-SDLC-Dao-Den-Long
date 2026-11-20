import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';

const project = resolve(fileURLToPath(new URL('../', import.meta.url)));
const root = process.argv.includes('--dist') ? resolve(project, 'dist') : project;
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8' };

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const vendor = path.startsWith('/vendor/');
    if (vendor && root === project && ['/vendor/three.module.js', '/vendor/three.core.js'].includes(path)) path = '/node_modules/three/build/' + path.split('/').at(-1);
    // Whitelist public source/assets. Never expose .git, .env or lab notes.
    if (!(path === '/index.html' || path === '/style.css' || path === '/game.contract.json' || path === '/version.json' || /^\/(src|vendor)\//.test(path) || /^\/node_modules\/three\/build\/three\.(module|core)\.js$/.test(path))) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') res.end(); else res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Đảo Đèn Lồng: http://localhost:${port}${root === project ? '' : ' (dist)'}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
