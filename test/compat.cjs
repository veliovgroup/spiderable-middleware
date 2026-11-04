// Dependency-free smoke test for the oldest supported Node.js release (10.9),
// where mocha and ESM tests can't run. Usage: node test/compat.cjs
'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const Spiderable = require('../lib/index.js');

const BOT_UA = 'Googlebot/2.1';
const servers = [];
const warnings = [];
const logger = {
  info() {},
  warn(...args) {
    warnings.push(args.join(' '));
  },
};

const listen = (server) => new Promise((resolve) => {
  servers.push(server);
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});

const get = (port, urlPath, method, abortAfter) => new Promise((resolve) => {
  const req = http.request({ host: '127.0.0.1', port, path: urlPath, method: method || 'GET', headers: { 'user-agent': BOT_UA } }, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    res.on('aborted', () => resolve({ error: 'aborted' }));
    res.on('error', (error) => resolve({ error: error.code || error.message }));
  });
  req.on('error', (error) => resolve({ error: error.code || error.message }));
  if (abortAfter) {
    setTimeout(() => {
      req.abort();
      resolve({ error: 'client-aborted' });
    }, abortAfter);
  }
  req.end();
});

const startApp = (spiderable) => {
  const state = { nextCalls: 0 };
  return listen(http.createServer((req, res) => {
    spiderable(req, res, () => {
      state.nextCalls++;
      res.end('APP');
    });
  })).then((port) => {
    state.port = port;
    return state;
  });
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  let handle = null;
  let attempts = 0;
  const onStubRequest = (req, res) => {
    attempts++;
    handle(req, res);
  };
  const fixtures = path.join(__dirname, 'fixtures');
  const httpsPort = await listen(https.createServer({
    key: fs.readFileSync(path.join(fixtures, 'stub-key.pem')),
    cert: fs.readFileSync(path.join(fixtures, 'stub-cert.pem')),
  }, onStubRequest));
  const httpPort = await listen(http.createServer(onStubRequest));

  const create = (opts) => new Spiderable(Object.assign({
    rootURL: 'http://example.com',
    serviceURL: `https://127.0.0.1:${httpsPort}`,
    auth: 'test:test',
    timeout: 500,
    logger,
    requestOptions: { rejectUnauthorized: false },
  }, opts));

  const render = (_req, res) => {
    res.writeHead(201, { 'content-type': 'text/html', 'set-cookie': 'a=b' });
    res.end('<html>RENDERED</html>');
  };

  const spiderable = create();
  assert.strictEqual(typeof spiderable, 'function');
  assert.ok(spiderable instanceof Spiderable);
  const app = await startApp(spiderable);

  handle = render;
  let resp = await get(app.port, '/page');
  assert.strictEqual(resp.status, 201, 'https render status');
  assert.strictEqual(resp.body, '<html>RENDERED</html>', 'https render body');
  assert.strictEqual(resp.headers['set-cookie'], undefined, 'ignored header dropped');

  resp = await get(app.port, '/page', 'HEAD');
  assert.strictEqual(resp.status, 201, 'HEAD status');
  assert.strictEqual(resp.body, '', 'HEAD body');

  const httpApp = await startApp(create({ serviceURL: `http://127.0.0.1:${httpPort}`, requestOptions: {} }));
  resp = await get(httpApp.port, '/page');
  assert.strictEqual(resp.body, '<html>RENDERED</html>', 'http render body');

  handle = () => {};
  resp = await get(app.port, '/slow');
  assert.strictEqual(resp.body, 'APP', 'timeout falls back to the app');

  attempts = 0;
  handle = (req, res) => {
    if (attempts === 1) {
      req.socket.destroy();
      return;
    }
    render(req, res);
  };
  resp = await get(app.port, '/retry');
  assert.strictEqual(resp.body, '<html>RENDERED</html>', 'retry renders');
  assert.strictEqual(attempts, 2, 'one retry');

  handle = (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.write('<html>partial');
    setTimeout(() => res.socket.destroy(), 50);
  };
  resp = await get(app.port, '/cut');
  assert.ok(resp.error, 'mid-body drop is not a complete page');

  const nextBefore = app.nextCalls;
  handle = () => {};
  resp = await get(app.port, '/abort', 'GET', 100);
  assert.strictEqual(resp.error, 'client-aborted');
  await wait(700);
  assert.strictEqual(app.nextCalls, nextBefore, 'no next() after client abort');

  resp = await new Promise((resolve) => {
    http.get({ host: '127.0.0.1', port: app.port, path: '/' }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve(body));
    });
  });
  assert.strictEqual(resp, 'APP', 'visitors reach the app');
};

run().then(() => {
  console.log(`compat: OK on Node.js ${process.version}`);
  servers.forEach((server) => server.close());
  process.exit(0);
}, (error) => {
  console.error(`compat: FAILED on Node.js ${process.version}`);
  console.error(error);
  console.error(warnings.join('\n'));
  process.exit(1);
});
