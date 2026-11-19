// Offline unit tests: a local HTTPS stub plays the rendering service,
// so the suite needs no network access and no ostr.io credentials
import { Agent as HttpAgent, createServer as createHttpServer, request as httpRequest } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { assert } from 'chai';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';
import connect from 'connect';
import express from 'express';
import Spiderable from 'spiderable-middleware';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const BOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const HUMAN_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15';
const APP_BODY = 'APP';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Capture console output of the package, keep test output clean
const logs = { warn: [], info: [] };
const original = { warn: console.warn, info: console.info };
const hasLog = (type, text) => logs[type].some((args) => args.map(String).join(' ').includes(text));

beforeEach(() => {
  logs.warn = [];
  logs.info = [];
  console.warn = (...args) => logs.warn.push(args);
  console.info = (...args) => logs.info.push(args);
});

afterEach(() => {
  console.warn = original.warn;
  console.info = original.info;
});

// Rendering service stub, each test sets `stub.handle`
const stub = {
  handle: null,
  requests: [],
  server: null,
  url: '',
};

// Apps under test, closed after the run
const apps = [];

const listen = (server) => new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});

before(async () => {
  stub.server = createHttpsServer({
    key: readFileSync(join(fixtures, 'stub-key.pem')),
    cert: readFileSync(join(fixtures, 'stub-cert.pem')),
  }, (req, res) => {
    const url = new URL(req.url, 'https://localhost');
    stub.requests.push({ method: req.method, headers: req.headers, url: url.searchParams.get('url'), bot: url.searchParams.get('___bot') });
    stub.handle(req, res, url);
  });
  stub.url = `https://127.0.0.1:${await listen(stub.server)}`;
});

after(() => {
  for (const server of apps) {
    server.close();
  }
  stub.server.close();
});

beforeEach(() => {
  stub.requests = [];
  stub.handle = (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html', 'x-prerender-id': 'STUB', 'set-cookie': 'a=b' });
    res.end('<html>RENDERED</html>');
  };
});

const ENV_KEYS = ['ROOT_URL', 'SPIDERABLE_SERVICE_URL', 'PRERENDER_SERVICE_URL', 'SPIDERABLE_SERVICE_AUTH', 'PRERENDER_SERVICE_AUTH', 'OSTR_AUTH', 'DEBUG'];
const withEnv = (env, fn) => {
  const saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  Object.assign(process.env, env);
  try {
    return fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  }
};

const create = (opts = {}) => withEnv({}, () => new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: stub.url,
  auth: 'test:test',
  timeout: 1000,
  requestOptions: { rejectUnauthorized: false },
  ...opts,
}));

// Starts an app with `spiderable` registered, `onRequest` runs after the middleware
const startApp = async (spiderable, onRequest) => {
  const state = { nextCalls: 0, returned: [] };
  const server = createHttpServer((req, res) => {
    res.on('finish', () => {
      // Runs after the package's own "finish" listener
      setImmediate(() => {
        state.timeoutListenersAfterFinish = res.listenerCount('timeout');
      });
    });
    state.returned.push(spiderable(req, res, () => {
      state.nextCalls++;
      if (!res.headersSent) {
        res.writeHead(200, { 'content-type': 'text/plain' });
      }
      res.end(APP_BODY);
    }));
    if (onRequest) {
      onRequest(req, res);
    }
  });
  apps.push(server);
  state.port = await listen(server);
  return state;
};

// Plain `http.request`, works on every Node.js release, unlike `fetch`
const get = (port, path, { method = 'GET', ua = BOT_UA, abortAfter } = {}) => new Promise((resolve) => {
  const req = httpRequest({ host: '127.0.0.1', port, path, method, headers: { 'user-agent': ua } }, (res) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    res.on('error', (error) => resolve({ error: error.code || error.message }));
    res.on('aborted', () => resolve({ error: 'aborted' }));
  });
  req.on('error', (error) => resolve({ error: error.code || error.message }));
  if (abortAfter) {
    setTimeout(() => {
      req.destroy();
      resolve({ error: 'client-aborted' });
    }, abortAfter);
  }
  req.end();
});

describe('Constructor', () => {
  it('returns a callable instance of Spiderable', () => {
    const spiderable = create();
    assert.isFunction(spiderable);
    assert.instanceOf(spiderable, Spiderable);
    assert.instanceOf(spiderable, Function);
    assert.strictEqual(spiderable.length, 3);
    assert.isFunction(spiderable.call);
    assert.isFunction(spiderable.handle);
    assert.isFunction(spiderable.handler);
    assert.strictEqual(spiderable.NAME, 'SPIDERABLE_MIDDLEWARE');
    assert.match(spiderable.userAgent, /^spiderable-middleware\/\d+\.\d+\.\d+$/);
  });

  it('refuses to load in a browser environment', () => {
    const require = createRequire(import.meta.url);
    const libPath = require.resolve('../lib/index.js');
    const cached = require.cache[libPath];
    delete require.cache[libPath];
    globalThis.window = {};
    try {
      assert.throws(() => require(libPath), /Browser environment isn't allowed/);
    } finally {
      delete globalThis.window;
      require.cache[libPath] = cached;
    }
  });

  it('works without `new`', () => {
    const spiderable = withEnv({}, () => Spiderable({ rootURL: 'http://example.com' }));
    assert.instanceOf(spiderable, Spiderable);
  });

  it('applies defaults', () => {
    const spiderable = withEnv({}, () => new Spiderable({ rootURL: 'http://example.com/' }));
    assert.strictEqual(spiderable.rootURL, 'http://example.com');
    assert.strictEqual(spiderable.serviceURL, 'https://render.ostr.io');
    assert.strictEqual(spiderable.auth, '');
    assert.strictEqual(spiderable.timeout, 180000);
    assert.isFalse(spiderable.debug);
    assert.isFalse(spiderable.only);
    assert.isFalse(spiderable.onlyRE);
    assert.isFalse(spiderable.ignoreRE);
    assert.isFalse(spiderable.sanitizeUrls);
    assert.deepEqual(spiderable.requestOptions, {});
    assert.strictEqual(spiderable.botsUA, Spiderable.prototype.botsUA);
    assert.strictEqual(spiderable.ignoredHeaders, Spiderable.prototype.ignoredHeaders);
    assert.instanceOf(spiderable.botsRE, RegExp);
    assert.instanceOf(spiderable.headersRE, RegExp);
  });

  it('reads ROOT_URL, SPIDERABLE_SERVICE_URL, SPIDERABLE_SERVICE_AUTH and DEBUG env variables', () => {
    const spiderable = withEnv({
      ROOT_URL: 'http://env.example.com/',
      SPIDERABLE_SERVICE_URL: 'https://env.render.example.com/',
      SPIDERABLE_SERVICE_AUTH: 'env:auth',
      DEBUG: 'true',
    }, () => new Spiderable());
    assert.strictEqual(spiderable.rootURL, 'http://env.example.com');
    assert.strictEqual(spiderable.serviceURL, 'https://env.render.example.com');
    assert.strictEqual(spiderable.auth, 'env:auth');
    assert.isTrue(spiderable.debug);
  });

  it('reads PRERENDER_SERVICE_URL and PRERENDER_SERVICE_AUTH env variables', () => {
    const spiderable = withEnv({
      ROOT_URL: 'http://env.example.com',
      PRERENDER_SERVICE_URL: 'https://prerender.example.com',
      PRERENDER_SERVICE_AUTH: 'pre:auth',
    }, () => new Spiderable('not an object'));
    assert.strictEqual(spiderable.serviceURL, 'https://prerender.example.com');
    assert.strictEqual(spiderable.auth, 'pre:auth');
  });

  it('reads OSTR_AUTH env variable', () => {
    const spiderable = withEnv({ ROOT_URL: 'http://env.example.com', OSTR_AUTH: 'ostr:auth' }, () => new Spiderable());
    assert.strictEqual(spiderable.auth, 'ostr:auth');
    assert.isFalse(hasLog('warn', 'opts.auth'));
  });

  it('warns at startup when `auth` is empty and the renderer is ostr.io', () => {
    create({ auth: '', serviceURL: 'https://render.ostr.io' });
    assert.isTrue(hasLog('warn', '`opts.auth` is empty'));
    logs.warn = [];
    create({ auth: '' });
    assert.isFalse(hasLog('warn', '`opts.auth` is empty'), 'self-hosted renderer may not need auth');
    logs.warn = [];
    create();
    assert.isFalse(hasLog('warn', '`opts.auth` is empty'));
  });

  it('throws without rootURL', () => {
    assert.throws(() => withEnv({}, () => new Spiderable()), /rootURL/);
  });

  it('throws on malformed rootURL', () => {
    assert.throws(() => create({ rootURL: 'example.com' }), /\{rootURL\} is malformed/);
  });

  it('throws on malformed serviceURL', () => {
    assert.throws(() => create({ serviceURL: 'render.ostr.io' }), /\{serviceURL\} is malformed/);
  });

  it('validates `retries`', () => {
    assert.strictEqual(create().retries, 1);
    assert.strictEqual(create({ retries: 0 }).retries, 0);
    for (const retries of [-1, 1.5, '2']) {
      logs.warn = [];
      assert.strictEqual(create({ retries }).retries, 1);
      assert.isTrue(hasLog('warn', 'opts.retries'));
    }
  });

  it('falls back to defaults and warns on invalid options', () => {
    const spiderable = create({
      staticExt: 'css',
      onlyRE: '/only',
      botsUA: 'googlebot',
      ignoredHeaders: 'age',
      only: '/only',
      ignore: '/ignore',
    });
    assert.strictEqual(spiderable.staticExt.source, create().staticExt.source);
    assert.isFalse(spiderable.onlyRE);
    assert.strictEqual(spiderable.botsUA, Spiderable.prototype.botsUA);
    assert.strictEqual(spiderable.ignoredHeaders, Spiderable.prototype.ignoredHeaders);
    assert.isFalse(spiderable.only);
    assert.isFalse(spiderable.ignoreRE);
    for (const option of ['staticExt', 'onlyRE', 'botsUA', 'ignoredHeaders', 'only', 'ignore']) {
      assert.isTrue(hasLog('warn', `opts.${option}`), `warns about opts.${option}`);
    }
  });

  it('sends warnings and debug messages to a custom `logger`', async () => {
    const custom = { warn: [], info: [] };
    const logger = {
      warn(...args) {
        custom.warn.push(args.join(' '));
      },
      info(...args) {
        custom.info.push(args.join(' '));
      },
    };
    const spiderable = create({ logger, debug: true, only: [42] });
    spiderable.handler({ method: 'GET', url: '/', headers: { 'user-agent': BOT_UA } }, {}, () => {});
    assert.isTrue(custom.warn.some((line) => line.startsWith('[WARN] [Spiderable-Middleware]') && line.includes('rule isn\'t instance')));
    assert.isTrue(custom.info.some((line) => line.startsWith('[INFO] [Spiderable-Middleware] [DEBUG]')));
    assert.lengthOf(logs.warn, 0, 'console is not used');
    assert.lengthOf(logs.info, 0, 'console is not used');
    assert.strictEqual(spiderable.logger, logger);
  });

  it('sends option warnings to a valid custom `logger`', () => {
    const lines = [];
    const logger = {
      warn(...args) {
        lines.push(args.join(' '));
      },
      info() {},
    };
    create({ logger, retries: -1, auth: '', serviceURL: 'https://render.ostr.io' });
    assert.isTrue(lines.some((line) => line.includes('opts.retries')));
    assert.isTrue(lines.some((line) => line.includes('`opts.auth` is empty')));
    assert.lengthOf(logs.warn, 0);
  });

  it('falls back to `console` when `logger` lacks `info` or `warn`', () => {
    for (const logger of ['console', { warn() {} }, { info() {} }]) {
      logs.warn = [];
      const spiderable = create({ logger });
      assert.strictEqual(spiderable.logger, console);
      assert.isTrue(hasLog('warn', 'opts.logger'));
    }
  });

  it('logs debug messages only when `debug` is enabled', () => {
    create({ debug: true });
    assert.isTrue(hasLog('info', 'Spiderable class initiated'));
    logs.info = [];
    create();
    assert.lengthOf(logs.info, 0);
  });
});

describe('getServiceURL()', () => {
  it('builds rendering URL with and without bot User-Agent', () => {
    const spiderable = create({ serviceURL: 'https://render.example.com' });
    const urlObj = new URL('http://example.com/path?q=1');
    urlObj.pathname = 'path';
    assert.strictEqual(spiderable.getServiceURL(urlObj), 'https://render.example.com/?url=' + encodeURIComponent('http://example.com/path?q=1'));
    assert.strictEqual(spiderable.getServiceURL(urlObj, 'Googlebot'), 'https://render.example.com/?url=' + encodeURIComponent('http://example.com/path?q=1') + '&___bot=Googlebot');
  });
});

describe('getRequestURL()', () => {
  const spiderable = create();

  it('returns false for regular visitors', () => {
    assert.isFalse(spiderable.getRequestURL({ url: '/page', headers: { 'user-agent': HUMAN_UA } }));
    assert.isFalse(spiderable.getRequestURL({ url: '/page', headers: {} }));
  });

  it('returns URL for crawlers', () => {
    const urlObj = spiderable.getRequestURL({ url: '/page?q=1', headers: { 'user-agent': BOT_UA } });
    assert.strictEqual(urlObj.pathname, '/page');
    assert.strictEqual(urlObj.search, '?q=1');
  });

  it('returns false for unparsable URLs', () => {
    assert.isFalse(spiderable.getRequestURL({ url: 'http://[bad', headers: { 'user-agent': BOT_UA } }));
  });

  it('folds `_escaped_fragment_` into the path for any User-Agent', () => {
    const urlObj = spiderable.getRequestURL({ url: '/page?_escaped_fragment_=/section&q=1', headers: { 'user-agent': HUMAN_UA } });
    assert.strictEqual(urlObj.pathname, '/page/section');
    assert.strictEqual(urlObj.search, '?q=1');
  });

  it('treats empty `_escaped_fragment_` as a render request and removes it', () => {
    const urlObj = spiderable.getRequestURL({ url: '/page?_escaped_fragment_=&q=1', headers: { 'user-agent': HUMAN_UA } });
    assert.strictEqual(urlObj.pathname, '/page');
    assert.strictEqual(urlObj.search, '?q=1');
    assert.strictEqual(spiderable.getRequestURL({ url: '/page?_escaped_fragment_=', headers: { 'user-agent': HUMAN_UA } }).search, '');
  });

  it('collapses repeated slashes with `sanitizeUrls`', () => {
    const sanitizing = create({ sanitizeUrls: true });
    const urlObj = sanitizing.getRequestURL({ url: '/a//b///c', headers: { 'user-agent': BOT_UA } });
    assert.strictEqual(urlObj.pathname, '/a/b/c');
  });
});

describe('middleware() rules', () => {
  const run = (spiderable, path, { method = 'GET', ua = BOT_UA, host } = {}) => {
    let nextCalls = 0;
    const result = spiderable.handler({ method, url: path, headers: { 'user-agent': ua, host } }, {}, () => {
      nextCalls++;
    });
    return { result, nextCalls };
  };

  it('warns and stops when called without its context', () => {
    let nextCalls = 0;
    assert.isFalse(Spiderable.prototype.middleware.call({}, {}, {}, () => {
      nextCalls++;
    }));
    assert.strictEqual(nextCalls, 0);
    assert.isTrue(hasLog('warn', 'lost its context'));
  });

  it('skips methods other than GET and HEAD', () => {
    assert.deepEqual(run(create(), '/', { method: 'POST' }), { result: false, nextCalls: 1 });
  });

  it('skips regular visitors', () => {
    assert.deepEqual(run(create(), '/', { ua: HUMAN_UA }), { result: false, nextCalls: 1 });
  });

  it('skips static files', () => {
    assert.deepEqual(run(create(), '/logo.png'), { result: false, nextCalls: 1 });
    assert.deepEqual(run(create({ staticExt: /\.html$/ }), '/page.html'), { result: false, nextCalls: 1 });
  });

  it('skips `/.well-known/` paths', () => {
    assert.deepEqual(run(create(), '/.well-known/acme-challenge/token'), { result: false, nextCalls: 1 });
  });

  it('skips requests to ostr.io hosts', () => {
    for (const host of ['ostr.io', 'render.ostr.io', 'OSTR.IO:443']) {
      assert.deepEqual(run(create(), '/', { host }), { result: false, nextCalls: 1 }, host);
    }
  });

  it('applies `onlyRE`', () => {
    const spiderable = create({ onlyRE: /^\/blog/ });
    assert.deepEqual(run(spiderable, '/about'), { result: false, nextCalls: 1 });
  });

  it('applies `only` string and RegExp rules, warns about other types', () => {
    const spiderable = create({ only: [42, '/exact', /^\/re\//] });
    assert.deepEqual(run(spiderable, '/other'), { result: false, nextCalls: 1 });
    assert.isTrue(hasLog('warn', 'rule isn\'t instance of {String} nor {RegExp}'));
  });

  it('applies `ignore`', () => {
    const spiderable = create({ ignore: ['/admin'] });
    assert.deepEqual(run(spiderable, '/admin/users'), { result: false, nextCalls: 1 });
  });

  it('applies `ignore` over a matching `only` rule', () => {
    const spiderable = create({ only: ['/admin'], ignore: ['/admin'] });
    assert.deepEqual(run(spiderable, '/admin'), { result: false, nextCalls: 1 });
  });
});

describe('Rendering', () => {
  it('proxies rendered page with status and filtered headers', async () => {
    stub.handle = (_req, res) => {
      res.writeHead(201, { 'content-type': 'text/html', 'x-prerender-id': 'STUB', 'set-cookie': 'a=b', 'x-empty': '' });
      res.end('<html>RENDERED</html>');
    };
    const app = await startApp(create());
    const resp = await get(app.port, '/page?q=1');
    assert.strictEqual(resp.status, 201);
    assert.strictEqual(resp.body, '<html>RENDERED</html>');
    assert.strictEqual(resp.headers['x-prerender-id'], 'STUB');
    assert.isUndefined(resp.headers['set-cookie']);
    assert.isUndefined(resp.headers['x-empty']);
    assert.strictEqual(app.nextCalls, 0);
    assert.deepEqual(app.returned, [undefined], 'callable instance returns nothing');
    assert.strictEqual(app.timeoutListenersAfterFinish, 0, 'timeout listener removed');
    assert.strictEqual(stub.requests[0].url, 'http://example.com/page?q=1');
    assert.strictEqual(stub.requests[0].bot, BOT_UA);
    assert.match(stub.requests[0].headers['user-agent'], /^spiderable-middleware\//);
  });

  it('drops hop-by-hop headers', () => {
    const { headersRE } = create();
    for (const header of ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'proxy-connection', 'te', 'trailer', 'transfer-encoding', 'upgrade']) {
      assert.isTrue(headersRE.test(header), header);
    }
    assert.isFalse(headersRE.test('content-type'));
  });

  it('renders pages matching `only` and `onlyRE` rules', async () => {
    const app = await startApp(create({ onlyRE: /^\/blog/, only: ['/exact', /^\/re\//] }));
    for (const path of ['/blog/post', '/exact', '/re/1']) {
      const resp = await get(app.port, path);
      assert.strictEqual(resp.body, '<html>RENDERED</html>', path);
    }
    assert.strictEqual(app.nextCalls, 0);
  });

  it('gives the same answer on every request for RegExp rules with `g` and `y` flags', async () => {
    const app = await startApp(create({ onlyRE: /^\/blog/g, only: [/^\/re\//gy], staticExt: /\.png$/g }));
    for (let attempt = 0; attempt < 3; attempt++) {
      assert.strictEqual((await get(app.port, '/blog/post')).body, '<html>RENDERED</html>', `onlyRE, attempt ${attempt}`);
      assert.strictEqual((await get(app.port, '/re/1')).body, '<html>RENDERED</html>', `only, attempt ${attempt}`);
      assert.strictEqual((await get(app.port, '/blog/logo.png')).body, APP_BODY, `staticExt, attempt ${attempt}`);
    }
    assert.lengthOf(stub.requests, 6);
  });

  it('sends the URL without `_escaped_fragment_` to the rendering service', async () => {
    const app = await startApp(create());
    await get(app.port, '/page?_escaped_fragment_=&q=1', { ua: HUMAN_UA });
    assert.strictEqual(stub.requests[0].url, 'http://example.com/page?q=1');
  });

  it('sends Basic auth and merges `requestOptions`', async () => {
    const app = await startApp(create({
      auth: 'user:pass',
      requestOptions: { rejectUnauthorized: false, headers: { 'x-custom': 'value' } },
    }));
    await get(app.port, '/');
    const { headers } = stub.requests[0];
    assert.strictEqual(headers.authorization, 'Basic ' + Buffer.from('user:pass').toString('base64'));
    assert.strictEqual(headers['x-custom'], 'value');
    assert.strictEqual(headers.accept, '*/*');
  });

  it('sends a ready `Basic xxx` auth value as is', async () => {
    const app = await startApp(create({ auth: 'Basic dXNlcjpwYXNz' }));
    await get(app.port, '/');
    assert.strictEqual(stub.requests[0].headers.authorization, 'Basic dXNlcjpwYXNz');
  });

  it('warns on 401 and 403 from the rendering service', async () => {
    stub.handle = (_req, res) => {
      res.writeHead(401);
      res.end('Unauthorized');
    };
    const app = await startApp(create());
    const resp = await get(app.port, '/');
    assert.strictEqual(resp.status, 401);
    assert.isTrue(hasLog('warn', 'Can\'t authenticate'));
  });

  it('answers HEAD requests without a body', async () => {
    const app = await startApp(create());
    const resp = await get(app.port, '/', { method: 'HEAD' });
    assert.strictEqual(resp.status, 200);
    assert.strictEqual(resp.body, '');
    assert.strictEqual(stub.requests[0].method, 'HEAD');
  });

  it('streams large pages', async () => {
    const page = 'x'.repeat(5 * 1024 * 1024);
    stub.handle = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(page);
    };
    const app = await startApp(create());
    const resp = await get(app.port, '/');
    assert.strictEqual(resp.body.length, page.length);
  });

  it('accepts the instance in Express `app.use()` (Meteor@3 `WebApp.handlers`) and connect', async () => {
    for (const [name, app] of [['express', express()], ['connect', connect()]]) {
      app.use(create());
      app.use((_req, res) => {
        res.end(APP_BODY);
      });
      const server = createHttpServer(app);
      apps.push(server);
      const port = await listen(server);
      assert.strictEqual((await get(port, '/')).body, '<html>RENDERED</html>', `${name}: crawler`);
      assert.strictEqual((await get(port, '/', { ua: HUMAN_UA })).body, APP_BODY, `${name}: visitor`);
    }
  });

  it('works through `.handle()` and `.handler()` aliases', async () => {
    const spiderable = create();
    for (const method of ['handle', 'handler']) {
      const app = await startApp(spiderable[method]);
      const resp = await get(app.port, '/');
      assert.strictEqual(resp.body, '<html>RENDERED</html>', method);
    }
  });

  it('renders hosts that only look like ostr.io', async () => {
    const app = await startApp(create());
    const resp = await new Promise((resolve) => {
      httpRequest({ host: '127.0.0.1', port: app.port, path: '/', headers: { 'user-agent': BOT_UA, host: 'notostr.io' } }, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve(body));
      }).end();
    });
    assert.strictEqual(resp, '<html>RENDERED</html>');
  });

  it('passes regular visitors to the app', async () => {
    const app = await startApp(create());
    const resp = await get(app.port, '/', { ua: HUMAN_UA });
    assert.strictEqual(resp.body, APP_BODY);
    assert.lengthOf(stub.requests, 0);
  });
});

describe('Rendering service over plain HTTP', () => {
  let httpStub;
  let httpStubURL;
  const seen = [];

  before(async () => {
    httpStub = createHttpServer((req, res) => {
      seen.push(new URL(req.url, 'http://localhost').searchParams.get('url'));
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html>RENDERED OVER HTTP</html>');
    });
    httpStubURL = `http://127.0.0.1:${await listen(httpStub)}`;
  });

  after(() => {
    httpStub.close();
  });

  it('renders through an `http://` serviceURL', async () => {
    const app = await startApp(create({ serviceURL: httpStubURL, requestOptions: {} }));
    const resp = await get(app.port, '/page');
    assert.strictEqual(resp.body, '<html>RENDERED OVER HTTP</html>');
    assert.deepEqual(seen.slice(-1), ['http://example.com/page']);
    assert.strictEqual(app.nextCalls, 0);
  });

  it('uses the agent from `requestOptions` as-is', async () => {
    const agent = new HttpAgent({ keepAlive: false });
    let used = 0;
    const createConnection = agent.createConnection.bind(agent);
    agent.createConnection = (...args) => {
      used++;
      return createConnection(...args);
    };
    const app = await startApp(create({ serviceURL: httpStubURL, requestOptions: { agent } }));
    const resp = await get(app.port, '/');
    assert.strictEqual(resp.body, '<html>RENDERED OVER HTTP</html>');
    assert.strictEqual(used, 1);
  });

  it('accepts `agent: false` in `requestOptions`', async () => {
    const app = await startApp(create({ serviceURL: httpStubURL, requestOptions: { agent: false } }));
    const resp = await get(app.port, '/');
    assert.strictEqual(resp.body, '<html>RENDERED OVER HTTP</html>');
  });
});

describe('Failures', () => {
  it('passes request to the app when the rendering service times out', async () => {
    stub.handle = () => {};
    let timeoutListeners = -1;
    const app = await startApp(create({ timeout: 200 }), (_req, res) => {
      res.on('finish', () => {
        timeoutListeners = res.listenerCount('timeout');
      });
    });
    const resp = await get(app.port, '/');
    assert.strictEqual(timeoutListeners, 0, 'the app owns the socket timeout after `next()`');
    assert.strictEqual(resp.body, APP_BODY);
    assert.strictEqual(app.nextCalls, 1);
    assert.isTrue(hasLog('warn', 'didn\'t respond within 200ms'));
  });

  it('retries once when the connection fails before a response', async () => {
    let attempts = 0;
    stub.handle = (req, res) => {
      attempts++;
      if (attempts === 1) {
        req.socket.destroy();
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html>RENDERED</html>');
    };
    const app = await startApp(create());
    const resp = await get(app.port, '/');
    assert.strictEqual(resp.body, '<html>RENDERED</html>');
    assert.strictEqual(attempts, 2);
    assert.strictEqual(app.nextCalls, 0);
    assert.lengthOf(logs.warn, 0, 'a successful retry is not a failure');
  });

  it('passes request to the app after `retries` failed attempts', async () => {
    for (const retries of [0, 2]) {
      let attempts = 0;
      stub.handle = (req) => {
        attempts++;
        req.socket.destroy();
      };
      const app = await startApp(create({ retries }));
      const resp = await get(app.port, '/');
      assert.strictEqual(resp.body, APP_BODY, `retries: ${retries}`);
      assert.strictEqual(attempts, retries + 1, `retries: ${retries}`);
      assert.isTrue(hasLog('warn', 'Error while connecting to external service'));
    }
  });

  it('does not retry after the rendering service answered', async () => {
    let attempts = 0;
    stub.handle = (_req, res) => {
      attempts++;
      res.writeHead(200, { 'content-type': 'text/html' });
      res.write('<html>partial');
      setTimeout(() => res.socket.destroy(), 50);
    };
    const app = await startApp(create());
    await get(app.port, '/');
    assert.strictEqual(attempts, 1);
  });

  it('destroys the response when the rendering service stalls after headers', async () => {
    stub.handle = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.write('<html>partial');
    };
    const app = await startApp(create({ timeout: 300 }));
    const resp = await get(app.port, '/');
    assert.isDefined(resp.error, 'crawler sees a failed response, not a complete page');
    assert.strictEqual(app.nextCalls, 0, 'no second response');
  });

  it('destroys the response when the rendering service resets the connection mid-body', async () => {
    // TLS sockets can't send RST, use a plain HTTP rendering service
    const rstStub = createHttpServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.write('<html>partial');
      setTimeout(() => {
        // RST instead of FIN on Node.js@>=16.17
        if (typeof res.socket.resetAndDestroy === 'function') {
          res.socket.resetAndDestroy();
        } else {
          res.socket.destroy();
        }
      }, 50);
    });
    apps.push(rstStub);
    const stubPort = await listen(rstStub);
    const app = await startApp(create({ serviceURL: `http://127.0.0.1:${stubPort}`, requestOptions: {} }));
    const resp = await get(app.port, '/');
    assert.isDefined(resp.error, 'crawler sees a failed response, not a complete page');
    assert.strictEqual(app.nextCalls, 0);
  });

  it('passes request to the app when the rendering service is unreachable', async () => {
    const closed = createHttpServer();
    const port = await listen(closed);
    await new Promise((resolve) => closed.close(resolve));
    const app = await startApp(create({ serviceURL: `https://127.0.0.1:${port}` }));
    const resp = await get(app.port, '/');
    assert.strictEqual(resp.body, APP_BODY);
    assert.isTrue(hasLog('warn', 'Error while connecting to external service'));
  });

  it('passes request to the app when the request can not be created', async () => {
    const app = await startApp(create({ requestOptions: { agent: 'not an agent' } }));
    const resp = await get(app.port, '/');
    assert.strictEqual(resp.body, APP_BODY);
    assert.deepEqual(app.returned, [undefined], 'callable instance returns nothing');
    assert.isTrue(hasLog('warn', 'Exception while connecting to external service'));
  });

  it('destroys the response when the rendering service drops mid-body', async () => {
    stub.handle = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.write('<html>partial');
      setTimeout(() => res.socket.destroy(), 50);
    };
    const app = await startApp(create());
    const resp = await get(app.port, '/');
    assert.isDefined(resp.error, 'crawler sees a failed response, not a complete page');
    assert.isTrue(hasLog('warn', 'closed connection before response was complete'));
  });

  it('stops rendering when the visitor disconnects', async () => {
    let rendererClosed = false;
    stub.handle = (req) => {
      req.on('close', () => {
        rendererClosed = true;
      });
    };
    const app = await startApp(create({ timeout: 2000 }));
    const resp = await get(app.port, '/', { abortAfter: 100 });
    assert.strictEqual(resp.error, 'client-aborted');
    await wait(200);
    assert.isTrue(rendererClosed, 'request to the rendering service is destroyed');
    assert.strictEqual(app.nextCalls, 0);
    assert.lengthOf(logs.warn, 0, 'client disconnects are not logged as errors');
  });

  it('logs unexpected request errors and stops rendering', async () => {
    stub.handle = () => {};
    const app = await startApp(create({ timeout: 2000 }), (req, res) => {
      setTimeout(() => {
        req.emit('error', new Error('unexpected request error'));
        res.end();
      }, 50);
    });
    await get(app.port, '/');
    assert.isTrue(hasLog('warn', 'unexpected request error'));
    assert.strictEqual(app.nextCalls, 0);
  });

  it('logs unexpected response errors and stops rendering', async () => {
    stub.handle = () => {};
    const app = await startApp(create({ timeout: 2000 }), (_req, res) => {
      setTimeout(() => {
        res.emit('error', new Error('unexpected response error'));
        res.end();
      }, 50);
    });
    await get(app.port, '/');
    assert.isTrue(hasLog('warn', 'unexpected response error'));
    assert.strictEqual(app.nextCalls, 0);
  });
});
