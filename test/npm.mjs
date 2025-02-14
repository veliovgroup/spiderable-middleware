import { createServer } from 'http';
import connect from 'connect';
import express from 'express';
import Spiderable from 'spiderable-middleware';
import { assert } from 'chai';
import { describe, it } from 'mocha';

const ROOT_URL = process.env.ROOT_URL;
if (!ROOT_URL) {
  throw new Error('ROOT_URL env.var is not defined! Please run test with ROOT_URL, like `ROOT_URL=http://localhost:3000 npm test`');
}

const re = {
  trailingSlash: /\/$/,
  beginningSlash: /^\//,
};

// Create base URLs for the different servers.
const vanillaURL = new URL(ROOT_URL);
vanillaURL.port = vanillaURL.port || '3003';

const connectURL = new URL(ROOT_URL);
connectURL.port = String(Number(vanillaURL.port) + 1);

const expressURL = new URL(ROOT_URL);
expressURL.port = String(Number(vanillaURL.port) + 5);

const staticFileName = 'test.pdf';
const auth = process.env.AUTH || 'test:test';

const only = ['/', /^\/articles\/?$/, /^\/article\/[0-9]{1,3}\/?$/];
const onlyRE = /^(\/|\/posts|\/post\/[A-z0-9]{16})\/?$/;
const ignore = ['/user', '/billing', '/article/100', '/post/HhstejsJKH123jJi'];
const respVanilla = 'Hello from vanilla NodeJS!\n';
const respConnect = 'Hello from Connect!\n';
const respExpress = 'Hello from Express!\n';

const testURLs = {
  valid: [
    '',
    '/',
    '/articles',
    '/articles/',
    '/article/1',
    '/article/11',
    '/article/111/',
    '/posts',
    '/posts/',
    '/post/HhstejsJKH123jJ6',
    '/post/HhstejsJKH123jJ6/',
  ],
  invalid: [
    '/asd',
    '///',
    '/articles/rand234',
    '/posts/234/',
    '/article/100',
    '/article/100/',
    '/post/HhstejsJKH123jJi',
    '/post/HhstejsJKH123jJi/',
  ],
};

// Setup Spiderable middleware instances
const spiderableConfig = {
  auth,
  only,
  onlyRE,
  ignore,
  // sanitizeUrls: true,
  serviceURL: 'https://render-bypass.ostr.io',
  requestOptions: {
    headers: {
      'x-custom-header': 'custom header value',
    },
  },
};

const prerenders = {
  vanilla: new Spiderable({
    ...spiderableConfig,
    rootURL: vanillaURL.toString(),
  }),
  express: new Spiderable({
    ...spiderableConfig,
    rootURL: expressURL.toString(),
  }),
  connect: new Spiderable({
    ...spiderableConfig,
    rootURL: connectURL.toString(),
  }),
};

const fetchOptions = {
  method: 'GET',
  headers: { 'User-Agent': 'GoogleBot' },
};

// Create Servers
// Vanilla HTTP server
createServer((req, res) => {
  prerenders.vanilla.handler(req, res, () => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end(respVanilla);
  });
}).listen(Number(vanillaURL.port));

// Connect server
const appConnect = connect();
appConnect
  .use(prerenders.connect.handler)
  .use((_req, res) => res.end(respConnect));
createServer(appConnect).listen(Number(connectURL.port));

// Express server
const appExpress = express();
appExpress.use(prerenders.express.handler).get('*', (_req, res) => {
  res.send(respExpress);
});
appExpress.listen(Number(expressURL.port));

// Tests using Mocha and Chai with async/await and native fetch
describe('Has Spiderable Object', () => {
  it('Spiderable is Constructor', () => {
    assert.isFunction(Spiderable, 'Spiderable is Constructor');
  });
});

describe('Has Spiderable Instance', () => {
  it('prerenders.vanilla is instance of Spiderable', () => {
    assert.instanceOf(prerenders.vanilla, Spiderable, 'prerendering is instance of Spiderable');
  });

  it('instance is created properly', () => {
    const expectedRootURL = vanillaURL.toString().replace(/\/$/, '');
    assert.strictEqual(
      prerenders.vanilla.rootURL,
      expectedRootURL,
      'rootURL is set and has right value'
    );
  });
});

describe('Has botsRE property', () => {
  it('botsRE is RegExp', () => {
    assert.typeOf(prerenders.vanilla.botsRE, 'regexp', 'botsRE is RegExp');
  });
});

describe('Check Prerendering & Middleware Setup', function () {
  this.slow(7000);
  this.timeout(14000);

  it('Vanilla node.js HTTP server', async function () {
    const response = await fetch(vanillaURL.toString(), fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isTrue(xPrerender && xPrerender.includes('TEST'), '"x-prerender-id" is TEST');

    const body = await response.text();
    assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
    assert.isTrue(body.includes(vanillaURL.toString()), 'Test response has valid source URL keyword');
  });

  it('Vanilla node.js HTTP server [static file]', async function () {
    const urlWithFile = new URL(staticFileName, vanillaURL).toString();
    const response = await fetch(urlWithFile, fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

    const body = await response.text();
    assert.strictEqual(body, respVanilla, 'Body returned from Vanilla node.js server');
  });

  it('Express HTTP server', async function () {
    const response = await fetch(expressURL.toString(), fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isTrue(
      xPrerender && xPrerender.includes('TEST'),
      '"x-prerender-id" is TEST'
    );

    const body = await response.text();
    assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
    assert.isTrue(
      body.includes(expressURL.toString()),
      'Test response has valid source URL keyword'
    );
  });

  it('Express HTTP server [static file]', async function () {
    const urlWithFile = new URL(staticFileName, expressURL).toString();
    const response = await fetch(urlWithFile, fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

    const body = await response.text();
    assert.strictEqual(body, respExpress, 'Body returned from Express server');
  });

  it('Connect server', async function () {
    const response = await fetch(connectURL.toString(), fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isTrue(
      xPrerender && xPrerender.includes('TEST'),
      '"x-prerender-id" is TEST'
    );

    const body = await response.text();
    assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
    assert.isTrue(
      body.includes(connectURL.toString()),
      'Test response has valid source URL keyword'
    );
  });

  it('Connect server [static file]', async function () {
    const urlWithFile = new URL(staticFileName, connectURL).toString();
    const response = await fetch(urlWithFile, fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

    const body = await response.text();
    assert.strictEqual(body, respConnect, 'Body returned from Connect server');
  });
});

describe('Check valid path rules', function () {
  this.slow(18000);
  this.timeout(32000);

  testURLs.valid.forEach((testPath) => {
    // Use the URL constructor to properly resolve the path.
    const vanillaTestUrl = new URL(testPath, vanillaURL).toString();
    it(`Vanilla node.js server - ${vanillaTestUrl}`, async function () {
      const response = await fetch(vanillaTestUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'GoogleBot' },
      });
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isTrue(
        xPrerender && xPrerender.includes('TEST'),
        '"x-prerender-id" is TEST'
      );

      const body = await response.text();
      assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
      assert.isTrue(
        body.includes(vanillaTestUrl),
        'Test response has valid source URL keyword'
      );
    });

    const expressTestUrl = new URL(testPath, expressURL).toString();
    it(`Express server - ${expressTestUrl}`, async function () {
      const response = await fetch(expressTestUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'GoogleBot' },
      });
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isTrue(
        xPrerender && xPrerender.includes('TEST'),
        '"x-prerender-id" is TEST'
      );

      const body = await response.text();
      assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
      assert.isTrue(
        body.includes(expressTestUrl),
        'Test response has valid source URL keyword'
      );
    });

    const connectTestUrl = new URL(testPath, connectURL).toString();
    it(`Connect server - ${connectTestUrl}`, async function () {
      const response = await fetch(connectTestUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'GoogleBot' },
      });
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isTrue(
        xPrerender && xPrerender.includes('TEST'),
        '"x-prerender-id" is TEST'
      );

      const body = await response.text();
      assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
      assert.isTrue(
        body.includes(connectTestUrl),
        'Test response has valid source URL keyword'
      );
    });
  });
});

describe('Check ignored path rules', function () {
  this.slow(2000);
  this.timeout(4000);

  testURLs.invalid.forEach((testPath) => {
    const vanillaTestUrl = `${vanillaURL.toString().replace(re.trailingSlash, '')}${testPath}`;
    it(`Vanilla node.js server - ${vanillaTestUrl}`, async function () {
      const response = await fetch(vanillaTestUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'GoogleBot' },
      });
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

      const body = await response.text();
      assert.strictEqual(body, respVanilla, 'Body returned from Vanilla node.js server');
    });

    const expressTestUrl = `${expressURL.toString().replace(re.trailingSlash, '')}${testPath}`;
    it(`Express server - ${expressTestUrl}`, async function () {
      const response = await fetch(expressTestUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'GoogleBot' },
      });
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

      const body = await response.text();
      assert.strictEqual(body, respExpress, 'Body returned from Express server');
    });

    const connectTestUrl = `${connectURL.toString().replace(re.trailingSlash, '')}${testPath}`;
    it(`Connect server - ${connectTestUrl}`, async function () {
      const response = await fetch(connectTestUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'GoogleBot' },
      });
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

      const body = await response.text();
      assert.strictEqual(body, respConnect, 'Body returned from Connect server');
    });
  });
});
