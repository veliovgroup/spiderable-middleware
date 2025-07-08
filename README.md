# Spiderable middleware

Search engines and social networks — such as Google, Facebook, Twitter, Yahoo, Bing, and many others — are constantly crawling your website to index its content. However, if your site is built using a modern JavaScript framework (*for example, React, Preact, Vue, Svelte, Angular, Backbone, Ember, Meteor, Blaze*), it serve only a basic HTML skeleton with script tags instead of fully rendered page content. This limitation negatively impacts website's SEO score, performance, and user experience when links shared by users around the web. The mission of `spiderable-middleware` and [`ostr.io`](https://ostr.io) is to enhance SEO and performance for modern JavaScript websites.

## Why Pre-render?

- 🕸 Execute JavaScript, — get rendered HTML page and its content;
- 🏎️ Improve delivery for dynamic and static pages via our advanced CDN and caching;
- 🏃‍♂️ Boost response rate and decrease response time with caching;
- 🚀 Optimized HTML markup for the best SEO score;
- 🎛️ Improve TTFB, LCP, INP, CLS, and other LightHouse metrics positively enhancing overall SEO score;
- 🖥 Supports PWAs and SPAs;
- 📱 Supports mobile-like crawlers;
- 💅 Supports [`styled-components`](https://styled-components.com);
- ⚡️ Supports [AMP (Accelerated Mobile Pages)](https://www.ampproject.org);
- 🤓 Works with `Content-Security-Policy` and other complex front-end security rules;
- 📦 This package shipped with [types](https://github.com/veliovgroup/spiderable-middleware/blob/master/types/index.d.ts) and [TS examples](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/);
- ❤️ Search engines and social network crawlers love straightforward and pre-rendered pages;
- 📱 Consistent link previews in messaging apps, like iMessage, Messages, Facebook, Slack, Telegram, WhatsApp, Viber, VK, Twitter, and other apps;
- 💻 Image, title, and description previews for links posted at social networks, like Facebook, X/Twitter, Instagram, and other social networks.

## ToC

- [Installation](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#installation)
- [Basic usage](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#usage)
- [Meteor.js usage](https://github.com/veliovgroup/spiderable-middleware/blob/master/docs/meteor.md)
- [Return genuine status code](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#return-genuine-status-code)
- [Speed-up rendering](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#speed-up-rendering)
- [Detect request from Prerendering engine during runtime](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#detect-request-from-pre-rendering-engine-during-runtime)
- [Detect type of Prerendering engine](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#detect-type-of-the-pre-rendering-engine)
- [JavaScript redirects](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#javascript-redirects)
- [AMP Support](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#amp-support)
- [Rendering Endpoints](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#rendering-endpoints)
- [API](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#api)
  - [Constructor `new Spiderable()`](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#constructor)
  - [Middleware](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#handle)
  - [TS Types](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#types)
- [Debugging](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#debugging)
- [Running Tests](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#running-tests)

## About Package

This package acts as middleware and intercepts requests to a Node.js application from web crawlers. All requests proxy passed to the Prerendering Service, which returns static, rendered HTML.

__This is SERVER only package. For NPM make sure it's imported only in Node.js.__

We made this package with developers in mind. It's well written in a very simple way, hackable, and easily tunable to meet all projects needs. This is the best option to offload bot's traffic from your servers to pre-rendering engine.

- __Note__: *This package proxies real HTTP headers and response code, to reduce overwhelming requests, try to avoid HTTP-redirect headers, like* `Location` *. Read how to [return genuine status code](https://github.com/veliovgroup/spiderable-middleware#return-genuine-status-code) and [handle JS-redirects](https://github.com/veliovgroup/spiderable-middleware#javascript-redirects)*
- __Note__: This is __server only package__. This package should be imported/initialized only within server code base

This middleware was tested and works like a charm with:

- [express](https://www.npmjs.com/package/express): [`example.js`](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/express.middleware.js), [`example.ts`](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/express.middleware.ts)
- [connect](https://www.npmjs.com/package/connect): [`example.js`](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/connect.middleware.js), [`example.ts`](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/connect.middleware.ts)
- [vanilla http(s) server](https://nodejs.org/api/http.html): [`example.js`](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/http.middleware.js), [`example.ts`](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/http.middleware.ts)
- [Nginx](https://nginx.org/en/docs/): [example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/nginx)
- [Apache](https://httpd.apache.org/): [example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/apache.htaccess)
- See [all examples](https://github.com/veliovgroup/spiderable-middleware/tree/master/examples)

All other frameworks which follow Node's middleware convention - will work too.

> This package was originally developed for [ostr.io](https://ostr.io) service. But it's not limited to, and can proxy-pass requests to any other rendering-endpoint.

## Installation

Install [`spiderable-middleware` package from NPM](https://www.npmjs.com/package/spiderable-middleware):

```sh
# using npmjs
npm install spiderable-middleware --save

# using yarn
yarn add spiderable-middleware
```

## Usage

Get ready in a few lines of code

### Basic usage

See [usage examples in `.js` and `.ts`](https://github.com/veliovgroup/spiderable-middleware/tree/master/examples) for quick copy-paste experience.

Start with adding `fragment` meta-tag to HTML template, head, or page:

```html
<html>
  <head>
    <meta name="fragment" content="!">
    <!-- ... -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

Import or require `spiderable-middleware` package:

```js
// ES6 import
import Spiderable from 'spiderable-middleware';

// or CommonJS require
const Spiderable = require('spiderable-middleware');
```

Register middleware handle:

```js
import express from 'express';
import Spiderable from 'spiderable-middleware';

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'test:test',
});

const app = express();
// ensure this is the most top registered handle
// to reduce response time and server load
app.use(spiderable.handle).get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000);
```

We provide various options for `serviceURL` as "[Rendering Endpoints](https://github.com/veliovgroup/ostrio/blob/master/docs/prerendering/rendering-endpoints.md)", each endpoint has its own features to fit every project needs.

## Return genuine status code

To pass expected status code of a response from front-end JavaScript framework to browser/crawlers use specially formatted HTML-comment. This comment __can be placed in any part of HTML-page__. `head` or `body` tag is the best place for it.

### Format

__html__:

```html
<!-- response:status-code=404 -->
```

__jade__:

```jade
// response:status-code=404
```

This package support __any__ standard and custom status codes:

- `201` - `<!-- response:status-code=201 -->`
- `401` - `<!-- response:status-code=401 -->`
- `403` - `<!-- response:status-code=403 -->`
- `500` - `<!-- response:status-code=500 -->`
- `514` - `<!-- response:status-code=514 -->` (*non-standard*)

## Speed-up rendering

To speed-up rendering, JS-runtime __should__ tell to the Spiderable engine when the page is ready. Set `window.IS_RENDERED` to `false`, and once the page is ready set this variable to `true`. Example:

```html
<html>
  <head>
    <meta name="fragment" content="!">
    <script>
      window.IS_RENDERED = false;
    </script>
  </head>
  <body>
    <!-- ... -->
    <script type="text/javascript">
      //Somewhere deep in app-code:
      window.IS_RENDERED = true;
    </script>
  </body>
</html>
```

## Detect request from Pre-rendering engine during runtime

Pre-rendering engine will set `window.IS_PRERENDERING` global variable to `true`. Detecting requests from pre-rendering engine are as easy as:

```js
if (window.IS_PRERENDERING) {
  // This request is coming from Pre-rendering engine
}
```

__Note__: `window.IS_PRERENDERING` can be `undefined` on initial page load, and may change during runtime. That's why we recommend to pre-define a setter for `IS_PRERENDERING`:

```js
let isPrerendering = false;
Object.defineProperty(window, 'IS_PRERENDERING', {
  set(val) {
    isPrerendering = val;
    if (isPrerendering === true) {
      // This request is coming from Pre-rendering engine
    }
  },
  get() {
    return isPrerendering;
  }
});
```

## Detect type of the Pre-rendering engine

Like browsers, — crawlers and bots may request page as "mobile" (small screen touch-devices) or as "desktop" (large screens without touch-events) the pre-rendering engine supports these two types. For cases when content needs to get optimized for different screens pre-rendering engine will set `window.IS_PRERENDERING_TYPE` global variable to `desktop` or `mobile`

```js
if (window.IS_PRERENDERING_TYPE === 'mobile') {
  // This request is coming from "mobile" web crawler and "mobile" pre-rendering engine
} else if (window.IS_PRERENDERING_TYPE === 'desktop') {
  // This request is coming from "desktop" web crawler and "desktop" pre-rendering engine
} else {
  // This request is coming from user
}
```

## JavaScript redirects

Redirect browser/crawler inside application when needed while a page is loading (*imitate navigation*), use any of classic JS-redirects can be used, including framework's navigation, or `History.pushState()`

```js
window.location.href = 'http://example.com/another/page';
window.location.replace('http://example.com/another/page');

Router.go('/another/page'); // framework's navigation !pseudo code
```

__Note__: *Only 4 redirects are allowed during one request after 4 redirects session will be terminated.*

## API

Create new instance and pass middleware to server's routes chain;

### *Constructor*

```ts
new Spiderable(opts?: SpiderableOptions);
```

- `opts` {*SpiderableOptions?*} - [Optional] Configuration options
- `opts.serviceURL` {*string*} - Valid URL to Spiderable endpoint (local or foreign). Default: `https://render.ostr.io`. Can be set via environment variables: `SPIDERABLE_SERVICE_URL` or `PRERENDER_SERVICE_URL`
- `opts.rootURL` {*string*} - Valid root URL of a website. Can be set via an environment variable: `ROOT_URL`
- `opts.auth` {*string*} - Auth string in next format: `user:pass`. Can be set via an environment variables: `SPIDERABLE_SERVICE_AUTH` or `PRERENDER_SERVICE_AUTH`. Default `null`
- `opts.sanitizeUrls` {*boolean*} - Sanitize URLs in order to "fix" badly composed URLs. Default `false`
- `opts.botsUA` {*string[]*} - An array of strings (case insensitive) with additional User-Agent names of crawlers that needs to get intercepted. See default [bot's names](https://github.com/veliovgroup/spiderable-middleware/blob/master/lib/index.js#L198). Set to `['.*']` to match all browsers and robots, to serve static pages to all users/visitors
- `opts.ignoredHeaders` {*string[]*} - An array of strings (case insensitive) with HTTP header names to exclude from response. See default [list of ignored headers](https://github.com/veliovgroup/spiderable-middleware/blob/master/lib/index.js#L206). Set to `['.*']` to ignore all headers
- `opts.ignore` {*string[]*} - An array of strings (case __sensitive__) with ignored routes. Note: it's based on first match, so route `/users` will cause ignoring of `/part/users/part`, `/users/_id` and `/list/of/users`, but not `/user/_id` or `/list/of/blocked-users`. Default `null`
- `opts.only` {*(String|RegExp)[]*} - An array of strings (case __sensitive__) or regular expressions (*could be mixed*). Define __exclusive__ route rules for pre-rendering. Could be used with `opts.onlyRE` rules. __Note:__ To define "safe" rules as {*RegExp*} it should start with `^` and end with `$` symbols, examples: `[/^\/articles\/?$/, /^\/article\/[A-z0-9]{16}\/?$/]`
- `opts.onlyRE` {*RegExp*} - Regular Expression with __exclusive__ route rules for pre-rendering. Could be used with `opts.only` rules
- `opts.timeout` {*number*} - Number, proxy-request timeout to rendering endpoint in milliseconds. Default: `180000`
- `opts.requestOptions` {*RequestOptions*} - Options for request module (like: `timeout`, `lookup`, `insecureHTTPParser`), for all available options see [`http` API docs](https://nodejs.org/docs/latest-v14.x/api/http.html#http_http_request_url_options_callback)
- `opts.debug` {*boolean*} - [Optional] Enable debug and extra logging, default: `false`

__Note:__ *Setting* `.onlyRE` *and/or* `.only` *rules are highly recommended. Otherwise, all routes, including randomly generated by bots will be subject of Pre-rendering and may cause unexpectedly higher usage.*

```js
// CommonJS
// const Spiderable = require('spiderable-middleware');

// ES6 import
// import Spiderable from 'spiderable-middleware';

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'test:test'
});

// More complex setup (recommended):
const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://render.ostr.io',
  auth: 'test:test',
  only: [
    /\/?/, // Root of the website
    /^\/posts\/?$/, // "/posts" path with(out) trailing slash
    /^\/post\/[A-z0-9]{16}\/?$/ // "/post/:id" path with(out) trailing slash
  ],
  // [Optionally] force ignore for secret paths:
  ignore: [
    '/account/', // Ignore all routes under "/account/*" path
    '/billing/' // Ignore all routes under "/billing/*" path
  ]
});
```

#### Configuration via env.vars

Same configuration can get achieved via setting up environment variables:

```sh
ROOT_URL='http://example.com'
SPIDERABLE_SERVICE_URL='https://render.ostr.io'
SPIDERABLE_SERVICE_AUTH='APIUser:APIPass'
```

alternatively, when migrating from other pre-rendering service — keep using existing variables, we support the next ones for compatibility:

```sh
ROOT_URL='http://example.com'
PRERENDER_SERVICE_URL='https://render.ostr.io'
PRERENDER_SERVICE_AUTH='APIUser:APIPass'
```

### handle

Middleware handle

```ts
const spiderable = new Spiderable();
spiderable.handle(req: IncomingMessage, res: ServerResponse, next: NextFunction): void;

// Alias that returns {boolean} 
// true — if prerendering takes over the request
spiderable.handler(req: IncomingMessage, res: ServerResponse, next: NextFunction): boolean;
```

Example using `connect` and `express` package:

```js
import { createServer } from 'node:http';
import Spiderable from 'spiderable-middleware';

const app = express();
// const app = connect();
const spiderable = new Spiderable();

app.use(spiderable.handle).use((_req, res) => {
  res.end('Hello from Connect!\n');
});

createServer(app).listen(3000;
```

Example using node.js `http` server:

```js
import { createServer } from 'node:http';
import Spiderable from 'spiderable-middleware';

// HTTP(s) Server
http.createServer((req, res) => {
  spiderable.handle(req, res, () => {
    // Callback, triggered if this request
    // is not a subject of spiderable pre-rendering
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end('Hello vanilla NodeJS!');
    // Or do something else ...
  });
}).listen(3000);
```

### Types

Import types right from NPM package

```ts
import Spiderable from 'spiderable-middleware';
import type { SpiderableOptions, NextFunction } from 'spiderable-middleware';

const options: SpiderableOptions = {
  rootURL: 'http://example.com',
  auth: 'test:test',
  debug: false,
  /* ..and other options.. */
};
expectType<SpiderableOptions>(options);

const spiderable = new Spiderable(options);
expectType<Spiderable>(spiderable);

const next: NextFunction = (_err?: unknown): void => {};
expectType<void>(spiderable.handle(req, res, next));
```

## AMP Support

To properly serve pages for [Accelerated Mobile Pages](https://www.ampproject.org) (AMP) we support following URI schemes:

```sh
# Regular URIs:
https://example.com/index.html
https://example.com/articles/article-title.html
https://example.com/articles/article-uniq-id/article-slug

# AMP optimized URIs (prefix):
https://example.com/amp/index.html
https://example.com/amp/articles/article-title.html
https://example.com/amp/articles/article-uniq-id/article-slug

# AMP optimized URIs (extension):
https://example.com/amp/index.amp.html
https://example.com/amp/articles/article-title.amp.html
```

All URLs with `.amp.` extension and `/amp/` prefix will be optimized for AMP.

## Rendering Endpoints

- __render (*default*)__ - `https://render.ostr.io` - This endpoint has "optimal" settings, and should fit 98% cases. This endpoint respects cache headers of Crawler and origin server
- __render-bypass (*devel/debug*)__ - `https://render-bypass.ostr.io` - This endpoint will bypass caching mechanisms. Use it when experiencing an issue, or during development, to make sure responses are not cached. It's safe to use this endpoint in production, but it may result in higher usage and response time
- __render-cache (*under attack*)__ - `https://render-cache.ostr.io` - This endpoint has the most aggressive caching mechanism. Use it to achieve the shortest response time, and when outdated pages (*for 6-12 hours*) are acceptable

To change default endpoint, grab [integration examples code](https://github.com/veliovgroup/spiderable-middleware/tree/master/examples) and replace `render.ostr.io`, with endpoint from the list above. For NPM integration change value of [`serviceURL`](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#constructor) option.

__Note:__ Described differences in caching behavior related to intermediate proxy caching, `Cache-Control` header will be always set to the value defined in "Cache TTL". Cached results at the "Pre-rendering Engine" end can be [purged at any time](https://github.com/veliovgroup/ostrio/blob/master/docs/prerendering/cache-purge.md).

## Convert dynamic website to static

`spiderable-middleware` package can get used to convert dynamic websites to rendered, cached, and lightweight static pages. Simply set `botsUA` to `['.*']` to achieve this behavior

```js
import Spiderable from 'spiderable-middleware';

const spiderable = new Spiderable({
  botsUA: ['.*']
  /* ... other options ...*/
});
```

## Debugging

Pass `{ debug: true }` or set `DEBUG=true` environment variable to enable debugging mode.

To make sure a server can reach a rendering endpoint run `cURL` command or send request via Node.js to (*replace example.com with your domain name*):

```shell
curl -v "https://test:test@render-bypass.ostr.io/?url=http://example.com"
```

In this example we're using `render-bypass.ostr.io` endpoint to avoid any possible cached results, [read more about rendering endpoints](https://github.com/veliovgroup/spiderable-middleware#rendering-endpoints). As API credentials we're using `test:test`, this part of URL can be replaced with `auth` option from Node.js example. The API credentials and instructions can be found at the very bottom of [Pre-rendering Panel](https://ostr.io/service/prerender) of a particular host, — click on <kbd>Integration Guide</kbd>

```sh
# cURL example:
curl -v "https://test:test@render-bypass.ostr.io/?url=http://example.com"
```

```js
// Node.js example:
const https = require('https');

https.get('https://test:test@render-bypass.ostr.io/?url=http://example.com', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk.toString('utf8');
  });

  resp.on('end', () => {
    console.log(data);
  });
}).on('error', (error) => {
  console.error(error);
});
```

## Running Tests

1. Clone this package
2. In Terminal (*Console*) go to directory where package was cloned
3. Then run:

### Node.js/Mocha

```sh
# Install development NPM dependencies:
npm install --save-dev
# Install NPM dependencies:
npm install --save

# Link package to itself
npm link
npm link spiderable-middleware

# Run tests:
ROOT_URL=http://127.0.0.1:3003 npm test

# Run same tests with extra-logging
DEBUG=true ROOT_URL=http://127.0.0.1:3003 npm test
# http://127.0.0.1:3003 can be changed to any local address, PORT is required!
```
