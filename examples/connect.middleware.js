import connect from 'connect';
import { createServer } from 'node:http';
import Spiderable from 'spiderable-middleware';

const app = connect();

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'test:test',
});

app.use(spiderable.handle);

app.use((_req, res) => {
  res.end('Hello from Connect!\n');
});

const server = createServer(app);

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
