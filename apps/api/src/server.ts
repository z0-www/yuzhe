import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function createApiServer() {
  return createHttpServer((req: IncomingMessage, res: ServerResponse) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/health' && req.method === 'GET') {
      res.end(JSON.stringify({ status: 'ok', service: 'yuzhe-api', dsh: 'not-configured' }));
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'not_found' }));
  });
}

export function startServer(port = Number(process.env.PORT ?? 8787)) {
  const server = createApiServer();
  return server.listen(port, () => console.log(`Yuzhe API listening on :${port}`));
}

const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  if (process.argv.includes('--self-test')) {
    const server = createApiServer().listen(0, () => {
      console.log('api self-test: server module loaded');
      server.close();
    });
  } else {
    startServer();
  }
}
