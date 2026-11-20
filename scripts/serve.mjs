import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep, dirname } from 'node:path';
import {pathToFileURL} from 'node:url';
import {existsSync} from 'node:fs';
import {readBoard,saveEntry} from './leaderboard-store.mjs';

const project = resolve(fileURLToPath(new URL('../', import.meta.url)));
const root = process.argv.includes('--dist') ? resolve(project, 'dist') : project;
export const boardFile=resolve(process.env.DAO_DATA_DIR||resolve(project,'data'),'leaderboard.json');
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8' };

export function createGameServer({publicRoot=root,benchmark=null,onBenchmark=null,onFirstFrame=null}={}){let writeQueue=Promise.resolve();return createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    const body=async()=>{let text='';for await(const chunk of req){text+=chunk;if(text.length>1024*1024)throw Error('Request too large');}return JSON.parse(text);};
    // Browser writes must originate from this same loopback server, not another website.
    if(req.method==='POST'&&req.headers.origin!==`http://${req.headers.host}`){json(403,{error:'Origin denied'});return;}
    if(url.pathname==='/api/leaderboard'){
      if(req.method==='GET')json(200,await readBoard(boardFile));
      else if(req.method==='POST'){const input=await body();writeQueue=writeQueue.catch(()=>{}).then(()=>saveEntry(boardFile,input));try{json(200,await writeQueue);}catch(e){json(400,{error:e.message});}}
      else json(405,{error:'Method not allowed'});return;
    }
    if(url.pathname==='/api/release-evidence'&&req.method==='GET'){const reports={};for(const name of ['verification','bench','soak']){try{reports[name]=JSON.parse(await readFile(resolve(project,`docs/proof/phase-4/${name}.json`),'utf8'));}catch{reports[name]=null;}}json(200,reports);return;}
    if(benchmark&&url.pathname==='/api/benchmark/config'){json(200,benchmark);return;}
    if(benchmark&&url.pathname==='/api/benchmark/first-frame'&&req.method==='POST'){onFirstFrame?.();json(200,{ok:true});return;}
    if(benchmark&&url.pathname==='/api/benchmark/result'&&req.method==='POST'){const report=await body();json(200,{ok:true});setImmediate(()=>onBenchmark?.(report));return;}
    if(url.pathname==='/api/demo-video'&&req.method==='POST'){
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>100*1024*1024)throw Error('Video too large');chunks.push(chunk);}if(!String(req.headers['content-type']).startsWith('video/mp4'))throw Error('Only MP4 supported');const path=resolve(project,'docs/demo/demo.mp4');await mkdir(dirname(path),{recursive:true});await writeFile(path,Buffer.concat(chunks));json(200,{saved:'docs/demo/demo.mp4'});return;
    }
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const vendor = path.startsWith('/vendor/');
    if (vendor && publicRoot === project && !existsSync(resolve(publicRoot,'.'+path)) && ['/vendor/three.module.js', '/vendor/three.core.js'].includes(path)) path = '/node_modules/three/build/' + path.split('/').at(-1);
    // Whitelist public source/assets. Never expose .git, .env or lab notes.
    if (!(path === '/index.html' || path === '/style.css' || path === '/game.contract.json' || path === '/version.json' || /^\/(src|vendor)\//.test(path) || /^\/node_modules\/three\/build\/three\.(module|core)\.js$/.test(path))) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const file = resolve(publicRoot, '.' + path);
    if (!file.startsWith(publicRoot + sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') res.end(); else res.end(data);
  } catch(e) { res.writeHead(req.url.startsWith('/api/')?400:404); res.end(req.url.startsWith('/api/')?JSON.stringify({error:e.message}):'Not found'); }
});}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
const exportIndex=process.argv.indexOf('--export-leaderboard');
if(exportIndex>=0){try{const out=process.argv[exportIndex+1];if(!out||out.startsWith('--'))throw Error('Missing export path');await mkdir(dirname(resolve(out)),{recursive:true});await writeFile(out,JSON.stringify(await readBoard(boardFile),null,2)+'\n');console.log(`Exported leaderboard: ${out}`);}catch(e){console.error(e.message);process.exitCode=2;}}
else {const server=createGameServer();
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Đảo Đèn Lồng: http://localhost:${port}${root === project ? '' : ' (dist)'}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}}
