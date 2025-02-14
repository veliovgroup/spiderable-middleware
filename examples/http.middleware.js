import { createServer } from 'http';
import Spiderable from 'spiderable-middleware';

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'test:test',
});

const requestListener = (req, res) => {
  spiderable.handler(req, res, () => {
    // Function called when request coming from users, not bots
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end('Hello vanilla NodeJS!');
  });
};

createServer(requestListener).listen(3000);
