import { createServer } from 'http';
import connect from 'connect';
import express from 'express';
import Spiderable from 'spiderable-middleware';
import { assert } from 'chai';
import { describe, it } from 'mocha';

import type { IncomingMessage, ServerResponse } from 'http';
import type { Request, Response } from 'express';
import type { NextHandleFunction } from 'connect';

// Ensure environment variables are set.
if (!process.env.ROOT_URL) {
  throw new Error('ROOT_URL env.var is not defined! Please run test with ROOT_URL, like `ROOT_URL=http://localhost:3000 npm test`');
}
const ROOT_URL: string = process.env.ROOT_URL;

// Regular expressions.
const re = {
  trailingSlash: /\/$/,
  beginningSlash: /^\//,
};

// Create base URLs for the different servers.
const vanillaURL = new URL(ROOT_URL);
vanillaURL.port = '3010';

const connectURL = new URL(ROOT_URL);
connectURL.port = String(Number(vanillaURL.port) + 1);

const expressURL = new URL(ROOT_URL);
expressURL.port = String(Number(vanillaURL.port) + 5);

const staticFileName = 'test.pdf';
const auth: string = process.env.AUTH || 'test:test';

const only: (string | RegExp)[] = ['/', /^\/articles\/?$/, /^\/article\/[0-9]{1,3}\/?$/];
const onlyRE: RegExp = /^(\/|\/posts|\/post\/[A-z0-9]{16})\/?$/;
const ignore: string[] = ['/user', '/billing', '/article/100', '/post/HhstejsJKH123jJi'];

const respVanilla: string = 'Hello from vanilla NodeJS!\n';
const respConnect: string = 'Hello from Connect!\n';
const respExpress: string = 'Hello from Express!\n';

interface TestURLs {
  valid: string[];
  invalid: string[];
}

const testURLs: TestURLs = {
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

// Setup Spiderable middleware instances.
interface SpiderableConfig {
  auth: string;
  only: (string | RegExp)[];
  onlyRE: RegExp;
  ignore: string[];
  serviceURL: string;
  requestOptions: {
    headers: { [key: string]: string };
  };
}

const spiderableConfig: SpiderableConfig = {
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

const fetchOptions: RequestInit = {
  method: 'GET',
  headers: { 'User-Agent': 'GoogleBot' },
};

// Create Servers

// Vanilla HTTP server.
createServer((req: IncomingMessage, res: ServerResponse) => {
  prerenders.vanilla.handler(req, res, () => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end(respVanilla);
  });
}).listen(Number(vanillaURL.port));

// Connect server.
const appConnect = connect();
appConnect
  .use(prerenders.connect.handler as NextHandleFunction)
  .use(( _req: IncomingMessage, res: ServerResponse) => res.end(respConnect));
createServer(appConnect).listen(Number(connectURL.port));

// Express server.
const appExpress = express();
appExpress.use(prerenders.express.handle);
appExpress.get('*', (_req: Request, res: Response) => {
  res.send(respExpress);
});
appExpress.listen(Number(expressURL.port));

// Tests using Mocha and Chai with async/await and native fetch
describe('[TS] Has Spiderable Object', () => {
  it('[TS] Spiderable is Constructor', () => {
    assert.isFunction(Spiderable, 'Spiderable is Constructor');
  });
});

describe('[TS] Has Spiderable Instance', () => {
  it('[TS] prerenders.vanilla is instance of Spiderable', () => {
    assert.instanceOf(prerenders.vanilla, Spiderable, 'prerendering is instance of Spiderable');
  });

  it('[TS] instance is created properly', () => {
    const expectedRootURL = vanillaURL.toString().replace(/\/$/, '');
    assert.strictEqual(
      prerenders.vanilla.rootURL,
      expectedRootURL,
      'rootURL is set and has right value'
    );
  });
});

describe('[TS] Has botsRE property', () => {
  it('[TS] botsRE is RegExp', () => {
    assert.typeOf(prerenders.vanilla.botsRE, 'regexp', 'botsRE is RegExp');
  });
});

describe('[TS] Check Prerendering & Middleware Setup', function () {
  this.slow(7000);
  this.timeout(14000);

  it('[TS] Vanilla node.js HTTP server', async function () {
    const response = await fetch(vanillaURL.toString(), fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isTrue(xPrerender !== null && xPrerender.includes('TEST'), '"x-prerender-id" is TEST');

    const body = await response.text();
    assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
    assert.isTrue(body.includes(vanillaURL.toString()), 'Test response has valid source URL keyword');
  });

  it('[TS] Vanilla node.js HTTP server [static file]', async function () {
    const urlWithFile = new URL(staticFileName, vanillaURL).toString();
    const response = await fetch(urlWithFile, fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

    const body = await response.text();
    assert.strictEqual(body, respVanilla, 'Body returned from Vanilla node.js server');
  });

  it('[TS] Express HTTP server', async function () {
    const response = await fetch(expressURL.toString(), fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isTrue(xPrerender !== null && xPrerender.includes('TEST'), '"x-prerender-id" is TEST');

    const body = await response.text();
    assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
    assert.isTrue(body.includes(expressURL.toString()), 'Test response has valid source URL keyword');
  });

  it('[TS] Express HTTP server [static file]', async function () {
    const urlWithFile = new URL(staticFileName, expressURL).toString();
    const response = await fetch(urlWithFile, fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

    const body = await response.text();
    assert.strictEqual(body, respExpress, 'Body returned from Express server');
  });

  it('[TS] Connect server', async function () {
    const response = await fetch(connectURL.toString(), fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isTrue(xPrerender !== null && xPrerender.includes('TEST'), '"x-prerender-id" is TEST');

    const body = await response.text();
    assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
    assert.isTrue(body.includes(connectURL.toString()), 'Test response has valid source URL keyword');
  });

  it('[TS] Connect server [static file]', async function () {
    const urlWithFile = new URL(staticFileName, connectURL).toString();
    const response = await fetch(urlWithFile, fetchOptions);
    assert.strictEqual(response.status, 200, 'status code is 200');

    const xPrerender = response.headers.get('x-prerender-id');
    assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

    const body = await response.text();
    assert.strictEqual(body, respConnect, 'Body returned from Connect server');
  });
});

describe('[TS] Check valid path rules', function () {
  this.slow(18000);
  this.timeout(32000);

  testURLs.valid.forEach((testPath: string) => {
    // Use the URL constructor to properly resolve the path.
    const vanillaTestUrl = new URL(testPath, vanillaURL).toString();
    it(`Vanilla node.js server - ${vanillaTestUrl}`, async function () {
      const response = await fetch(vanillaTestUrl, fetchOptions);
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isTrue(xPrerender !== null && xPrerender.includes('TEST'), '"x-prerender-id" is TEST');

      const body = await response.text();
      assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
      assert.isTrue(body.includes(vanillaTestUrl), 'Test response has valid source URL keyword');
    });

    const expressTestUrl = new URL(testPath, expressURL).toString();
    it(`Express server - ${expressTestUrl}`, async function () {
      const response = await fetch(expressTestUrl, fetchOptions);
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isTrue(xPrerender !== null && xPrerender.includes('TEST'), '"x-prerender-id" is TEST');

      const body = await response.text();
      assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
      assert.isTrue(body.includes(expressTestUrl), 'Test response has valid source URL keyword');
    });

    const connectTestUrl = new URL(testPath, connectURL).toString();
    it(`Connect server - ${connectTestUrl}`, async function () {
      const response = await fetch(connectTestUrl, fetchOptions);
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isTrue(xPrerender !== null && xPrerender.includes('TEST'), '"x-prerender-id" is TEST');

      const body = await response.text();
      assert.isTrue(body.includes('[PASSED]'), 'Test response has "[PASSED]" keyword');
      assert.isTrue(body.includes(connectTestUrl), 'Test response has valid source URL keyword');
    });
  });
});

describe('[TS] Check ignored path rules', function () {
  this.slow(2000);
  this.timeout(4000);

  testURLs.invalid.forEach((testPath: string) => {
    const vanillaTestUrl = `${vanillaURL.toString().replace(re.trailingSlash, '')}${testPath}`;
    it(`Vanilla node.js server - ${vanillaTestUrl}`, async function () {
      const response = await fetch(vanillaTestUrl, fetchOptions);
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

      const body = await response.text();
      assert.strictEqual(body, respVanilla, 'Body returned from Vanilla node.js server');
    });

    const expressTestUrl = `${expressURL.toString().replace(re.trailingSlash, '')}${testPath}`;
    it(`Express server - ${expressTestUrl}`, async function () {
      const response = await fetch(expressTestUrl, fetchOptions);
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

      const body = await response.text();
      assert.strictEqual(body, respExpress, 'Body returned from Express server');
    });

    const connectTestUrl = `${connectURL.toString().replace(re.trailingSlash, '')}${testPath}`;
    it(`Connect server - ${connectTestUrl}`, async function () {
      const response = await fetch(connectTestUrl, fetchOptions);
      assert.strictEqual(response.status, 200, 'status code is 200');

      const xPrerender = response.headers.get('x-prerender-id');
      assert.isFalse(!!xPrerender, 'Has no "x-prerender-id" header');

      const body = await response.text();
      assert.strictEqual(body, respConnect, 'Body returned from Connect server');
    });
  });
});
