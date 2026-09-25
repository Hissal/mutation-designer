import http from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 4174);
const files = new Map([
  ['/', ['app/index.html', 'text/html']],
  ...['controller.js','view.js','model.js','storage.js','examples.js'].map(name=>[`/app/${name}`, [`app/${name}`, 'text/javascript']]),
  ['/app/style.css', ['app/style.css', 'text/css']],
]);
const server = http.createServer(async (req,res) => {
  const asset = files.get(new URL(req.url,'http://localhost').pathname);
  if(!asset || !['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end('Not found');return;}
  try {
    const data=await readFile(new URL(asset[0],import.meta.url));
    res.writeHead(200,{'Content-Type':`${asset[1]}; charset=utf-8`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?undefined:data);
  } catch {res.writeHead(500);res.end('Application asset unavailable');}
});
server.on('error',error=>{console.error(`Could not start Mutation Designer: ${error.message}`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Mutation Designer: http://127.0.0.1:${port}/`));
