import { createServer } from 'node:http';
const port = Number(process.env.PORT ?? 8787);
const server = createServer((req,res)=>{ res.setHeader('content-type','application/json'); if(req.url==='/health' && req.method==='GET'){res.end(JSON.stringify({status:'ok',service:'yuzhe-api',dsh:'not-configured'})); return;} res.statusCode=404; res.end(JSON.stringify({error:'not_found'})); });
if (process.argv.includes('--self-test')) { server.listen(0,()=>{ console.log('api self-test: server module loaded'); server.close(); }); } else server.listen(port,()=>console.log(`Yuzhe API listening on :${port}`));
