import { expectType, expectError } from 'tsd';
import Spiderable from 'spiderable-middleware';
import type { SpiderableOptions, NextFunction } from 'spiderable-middleware';
import type { IncomingMessage, ServerResponse, RequestOptions } from 'http';
import { URL } from 'url';

// Test SpiderableOptions interface with all optional properties.
const options: SpiderableOptions = {
  serviceURL: 'https://render.ostr.io',
  rootURL: 'http://myapp.com',
  auth: 'test:test',
  sanitizeUrls: true,
  botsUA: ['googlebot', 'bingbot'],
  ignoredHeaders: ['x-powered-by', 'x-custom-header'],
  ignore: ['/ignore-path'],
  only: ['^/only', /regex/],
  onlyRE: /^\/only/,
  timeout: 10000,
  requestOptions: {
    headers: {
      'x-http-custom': 'value'
    }
  },
  debug: false,
  staticExt: /\.(css|js)$/,
};

expectType<SpiderableOptions>(options);

// Instantiate Spiderable with options.
const spiderable = new Spiderable(options);
expectType<Spiderable>(spiderable);

// Instantiate Spiderable without any options.
const spiderableNoOpts = new Spiderable();
expectType<Spiderable>(spiderableNoOpts);

// Verify property types.
expectType<string>(spiderable.NAME);
expectType<string>(spiderable.userAgent);
expectType<string>(spiderable.auth);
expectType<boolean>(spiderable.debug);
expectType<(string | RegExp)[] | false>(spiderable.only);
expectType<RegExp | false>(spiderable.onlyRE);
expectType<string[]>(spiderable.botsUA);
expectType<string>(spiderable.rootURL);
expectType<number>(spiderable.timeout);
expectType<RegExp>(spiderable.staticExt);
expectType<string>(spiderable.serviceURL);
expectType<boolean>(spiderable.sanitizeUrls);
expectType<string[]>(spiderable.ignoredHeaders);
expectType<RequestOptions>(spiderable.requestOptions);
expectType<RegExp>(spiderable.headersRE);
expectType<RegExp>(spiderable.botsRE);
expectType<RegExp | false>(spiderable.ignoreRE);

// Test the getServiceURL method.
const urlInstance = new URL('http://myapp.com');
const serviceURLStr = spiderable.getServiceURL(urlInstance, 'googlebot');
expectType<string>(serviceURLStr);

// Test the getRequestURL method.
// Create a dummy IncomingMessage. In real use this would be a proper request object.
const req = { url: 'http://myapp.com/page' } as IncomingMessage;
const requestURL = spiderable.getRequestURL(req);
expectType<URL | false>(requestURL);

// Test the middleware function and its aliases.
const res = {} as ServerResponse;
const next: NextFunction = (_err?: unknown) => {
  /* noop */
};

expectType<boolean>(spiderable.middleware(req, res, next));
expectType<boolean>(spiderable.handler(req, res, next));
expectType<void>(spiderable.handle(req, res, next));

// Test NextFunction type.
const nextFunction: NextFunction = (err?: unknown) => {
  if (err) {
    // handle error
  }
};
nextFunction();
nextFunction(new Error('test error'));

// Ensure that providing an incorrect type for SpiderableOptions results in a type error.
expectError<SpiderableOptions>({
  serviceURL: 123, // Error: number is not assignable to string.
});
