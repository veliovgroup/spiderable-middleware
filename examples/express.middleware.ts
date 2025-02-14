import express from 'express';
import Spiderable from 'spiderable-middleware';

const app = express();
const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'text:test',
});

app.use(spiderable.handle).get('/', (_req, res): void => {
  res.send('Hello World');
});

app.listen(3000);
