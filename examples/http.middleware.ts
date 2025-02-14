import { createServer } from 'node:http';
import Spiderable from 'spiderable-middleware';

import type { IncomingMessage, ServerResponse } from 'node:http';

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'test:test',
});

const requestListener = (req: IncomingMessage, res: ServerResponse): void => {
  spiderable.handler(req, res, () => {
    // Function called when request coming from users, not bots
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Hello vanilla NodeJS!');
  });
};

const server = createServer(requestListener);
server.listen(3000, (): void => {
  console.log('Server running on port 3000');
});
