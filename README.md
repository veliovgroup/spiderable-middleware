# Spiderable middleware

Google, Facebook, Twitter, Yahoo, and Bing and all other crawlers and search engines are constantly trying to view your website. If your website is built on top of the JavaScript framework like, but not limited to - Angular, Backbone, Ember, Meteor, React, MEAN most of the front-end solutions returns basic HTML-markup and script-tags to crawlers, but not content of your page. The mission of `spiderable-middleware` and [ostr.io](https://ostr.io) are to boost your SEO experience without a headache.

## Why Pre-render?

- 🕸 Execute JavaScript, as web-crawlers and search engines can't run JS code;
- 🏃‍♂️ Boost response rate and decrease response time with caching;
- 🚀 Optimized HTML markup for best SEO score;
- 🖥 Support for PWAs and SPAs;
- 📱 Support for mobile-like crawlers;
- 💅 Support [`styled-components`](https://styled-components.com);
- ⚡️ Support [AMP (Accelerated Mobile Pages)](https://www.ampproject.org);
- 🤓 Works with `Content-Security-Policy` and other "complicated" front-end security;
- ❤️ Search engines and social network crawlers love straightforward and pre-rendered pages;
- 📱 Consistent link previews in messaging apps, like iMessage, Messages, Facebook, Slack, Telegram, WhatsApp, Viber, VK, Twitter, etc.;
- 💻 Image, title, and description previews for posted links at social networks, like Facebook, Twitter, VK and others.

## ToC

- [Installation](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#installation)
- [Basic usage](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#usage)
- [Meteor.js usage](https://github.com/veliovgroup/spiderable-middleware/blob/master/docs/meteor.md)
- [Return genuine status code](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#return-genuine-status-code)
- [Speed-up rendering](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#speed-up-rendering)
- [Detect request from Prerendering engine during runtime](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#detect-request-from-pre-rendering-engine-during-runtime)
- [JavaScript redirects](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#javascript-redirects)
- [AMP Support](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#amp-support)
- [Rendering Endpoints](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#rendering-endpoints)
- [API](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#api)
  - [Constructor `new Spiderable()`](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#constructor-new-spiderableopts)
  - [Middleware](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#spiderablehandlerreq-res-next)
- [Debugging](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#debugging)
- [Running Tests](https://github.com/veliovgroup/spiderable-middleware?tab=readme-ov-file#running-tests)

## About Package

This package acts as middleware and intercepts requests to your Node.js application from web crawlers. All requests proxy passed to the Prerendering Service, which returns static, rendered HTML.

__This is SERVER only package. For NPM make sure you're importing library only in Node.js. For Meteor.js please make sure library imported and executed only on SERVER.__

We made this package with developers in mind. It's well written in a very simple way, hackable, and easily tunable to meet your needs, can be used to turn dynamic pages into rendered, cached, and lightweight static pages, just set `botsUA` to `['.*']`. This is the best option to offload servers unless a website gets updated more than once in 4 hours.

- __Note__: *This package proxies real HTTP headers and response code, to reduce overwhelming requests, try to avoid HTTP-redirect headers, like* `Location` *and others. Read how to [return genuine status code](https://github.com/veliovgroup/spiderable-middleware#return-genuine-status-code) and [handle JS-redirects](https://github.com/veliovgroup/spiderable-middleware#javascript-redirects).*
- __Note__: This is __server only package__. For isomorphic environments, *like Meteor.js*, this package should be imported/initialized only at server code base.

This middleware was tested and works like a charm with:

- [express](https://www.npmjs.com/package/express): [example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/express.middleware.js)
- [connect](https://www.npmjs.com/package/connect): [example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/connect.middleware.js)
- [vanilla http(s) server](https://nodejs.org/api/http.html): [example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/http.middleware.js)
- [meteor.js](https://github.com/veliovgroup/spiderable-middleware/blob/master/docs/meteor.md): [example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/meteor.middleware.js)
- [Nginx](https://nginx.org/en/docs/): [example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/nginx)
- [Apache](https://httpd.apache.org/): [example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/apache.htaccess)
- See [all examples](https://github.com/veliovgroup/spiderable-middleware/tree/master/examples)

All other frameworks which follow Node's middleware convention - will work too.

> This package was originally developed for [ostr.io](https://ostr.io) service. But it's not limited to, and can proxy-pass requests to any other rendering-endpoint.

## Installation

Install [`spiderable-middleware` package from NPM](https://www.npmjs.com/package/spiderable-middleware) for Node.js usage, alternatively see [Meteor.js specific setup documentation](https://github.com/veliovgroup/spiderable-middleware/blob/master/docs/meteor.md)

```sh
npm install spiderable-middleware --save
```

## Usage

Get ready in a few lines of code

### Basic usage

See [all examples](https://github.com/veliovgroup/spiderable-middleware/tree/master/examples).

First, add `fragment` meta-tag to your HTML template:

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

```js
// Make sure this code isn't exported to the Browser bundle
// and executed only on SERVER (Node.js)
const express = require('express');
const Spiderable = require('spiderable-middleware');

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'APIUser:APIPass'
});

const app = express();
app.use(spiderable.handler).get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000);
```

We provide various options for `serviceURL` as "[Rendering Endpoints](https://github.com/veliovgroup/ostrio/blob/master/docs/prerendering/rendering-endpoints.md)", each endpoint has its own features to fit every project needs.

## Return genuine status code

To pass expected response code from front-end JavaScript framework to browser/crawlers, you need to create specially formatted HTML-comment. This comment __can be placed in any part of HTML-page__. `head` or `body` tag is the best place for it.

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

To speed-up rendering, you __should__ tell to the Spiderable engine when your page is ready. Set `window.IS_RENDERED` to `false`, and once your page is ready set this variable to `true`. Example:

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
      //Somewhere deep in your app-code:
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

## JavaScript redirects

If you need to redirect browser/crawler inside your application, while a page is loading (*imitate navigation*), you're free to use any of classic JS-redirects as well as your framework's navigation, or `History.pushState()`

```js
window.location.href = 'http://example.com/another/page';
window.location.replace('http://example.com/another/page');

Router.go('/another/page'); // framework's navigation !pseudo code
```

__Note__: *Only 4 redirects are allowed during one request after 4 redirects session will be terminated.*

## API

### *Constructor* `new Spiderable([opts])`

- `opts` {*Object*} - Configuration options
- `opts.serviceURL` {*String*} - Valid URL to Spiderable endpoint (local or foreign). Default: `https://render.ostr.io`. Can be set via environment variables: `SPIDERABLE_SERVICE_URL` or `PRERENDER_SERVICE_URL`
- `opts.rootURL` {*String*} - Valid root URL of your website. Can be set via an environment variable: `ROOT_URL`
- `opts.auth` {*String*} - [Optional] Auth string in next format: `user:pass`. Can be set via an environment variables: `SPIDERABLE_SERVICE_AUTH` or `PRERENDER_SERVICE_AUTH`. Default `null`
- `opts.sanitizeUrls` {*Boolean*} - [Optional] Sanitize URLs in order to "fix" badly composed URLs. Default `false`
- `opts.botsUA` {*[String]*} - [Optional] An array of strings (case insensitive) with additional User-Agent names of crawlers you would like to intercept. See default [bot's names](https://github.com/veliovgroup/spiderable-middleware/blob/master/lib/index.js#L128). Set to `['.*']` to match all browsers and robots, to serve static pages to all users/visitors
- `opts.ignoredHeaders` {*[String]*} - [Optional] An array of strings (case insensitive) with HTTP header names to exclude from response. See default [list of ignored headers](https://github.com/veliovgroup/spiderable-middleware/blob/master/lib/index.js#L130). Set to `['.*']` to ignore all headers
- `opts.ignore` {*[String]*} - [Optional] An array of strings (case __sensitive__) with ignored routes. Note: it's based on first match, so route `/users` will cause ignoring of `/part/users/part`, `/users/_id` and `/list/of/users`, but not `/user/_id` or `/list/of/blocked-users`. Default `null`
- `opts.only` {*[String|RegExp]*} - [Optional] An array of strings (case __sensitive__) or regular expressions (*could be mixed*). Define __exclusive__ route rules for pre-rendering. Could be used with `opts.onlyRE` rules. __Note:__ To define "safe" rules as {*RegExp*} it should start with `^` and end with `$` symbols, examples: `[/^\/articles\/?$/, /^\/article\/[A-z0-9]{16}\/?$/]`
- `opts.onlyRE` {*RegExp*} - [Optional] Regular Expression with __exclusive__ route rules for pre-rendering. Could be used with `opts.only` rules
- `opts.timeout` {*Number*} - [Optional] Number, proxy-request timeout to rendering endpoint in milliseconds. Default: `180000`
- `opts.requestOptions` {*Object*} - [Optional] Options for request module (like: `timeout`, `lookup`, `insecureHTTPParser`), for all available options see [`http` API docs](https://nodejs.org/docs/latest-v14.x/api/http.html#http_http_request_url_options_callback)
- `opts.debug` {*Boolean*} - [Optional] Enable debug and extra logging, default: `false`

__Note:__ *Setting* `.onlyRE` *and/or* `.only` *rules are highly recommended. Otherwise, all routes, including randomly generated by bots will be subject of Pre-rendering and may cause unexpectedly higher usage.*

```js
// CommonJS
// const Spiderable = require('spiderable-middleware');

// ES6 import
// import Spiderable from 'spiderable-middleware';

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'APIUser:APIPass'
});

// More complex setup (recommended):
const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://render.ostr.io',
  auth: 'APIUser:APIPass',
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

### Configuration via env.vars

Same configuration can get achieved via setting up environment variables:

```sh
ROOT_URL='http://example.com'
SPIDERABLE_SERVICE_URL='https://render.ostr.io'
SPIDERABLE_SERVICE_AUTH='APIUser:APIPass'
```

alternatively if you're migrating from other pre-rendering service you can keep using existing variables, we support it for compatibility

```sh
ROOT_URL='http://example.com'
PRERENDER_SERVICE_URL='https://render.ostr.io'
PRERENDER_SERVICE_AUTH='APIUser:APIPass'
```

### `spiderable.handler(req, res, next)`

Middleware handler. Alias: `spiderable.handle`.

```js
// Express, Connect:
app.use(spiderable.handler);

// Meteor:
WebApp.connectHandlers.use(spiderable.handler.bind(spiderable));

// HTTP(s) Server
http.createServer((req, res) => {
  spiderable.handler(req, res, () => {
    // Callback, triggered if this request
    // is not a subject of spiderable pre-rendering
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end('Hello vanilla NodeJS!');
    // Or do something else ...
  });
}).listen(3000);
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

- __render (*default*)__ - `https://render.ostr.io` - This endpoint has "optimal" settings, and should fit 98% cases. Respects cache headers of both Crawler and your server;
- __render-bypass (*devel/debug*)__ - `https://render-bypass.ostr.io` - This endpoint has bypass caching mechanism (*almost no cache*). Use it if you're experiencing an issue, or during development, to make sure you're not running into the intermediate cache. You're safe to use this endpoint in production, but it may result in higher usage and response time.
- __render-cache (*under attack*)__ - `https://render-cache.ostr.io` - This endpoint has the most aggressive caching mechanism. Use it if you're looking for the shortest response time, and don't really care about outdated pages in cache for 6-12 hours

To change default endpoint, grab [integration examples code](https://github.com/veliovgroup/spiderable-middleware/tree/master/examples) and replace `render.ostr.io`, with endpoint of your choice. For NPM/Meteor integration change value of [`serviceURL`](https://github.com/veliovgroup/spiderable-middleware#basic-usage) option.

__Note:__ Described differences in caching behavior related to intermediate proxy caching, `Cache-Control` header will be always set to the value defined in "Cache TTL". Cached results at the "Pre-rendering Engine" end can be [purged at any time](https://github.com/veliovgroup/ostrio/blob/master/docs/prerendering/cache-purge.md).

## Debugging

To make sure a server can reach our rendering endpoint run cURL command or send request via Node.js to (*replace example.com with your domain name*) `https://test:test@render-bypass.ostr.io/?url=http://example.com`.

In this example we're using `render-bypass.ostr.io` endpoint to avoid any possible cached results, [read more about rendering endpoints](https://github.com/veliovgroup/spiderable-middleware#rendering-endpoints). As API credentials we're using `test:test`, this part of URL can be replaced with `auth` option from Node.js example. Your API credentials and instructions can be found at the very bottom of [Pre-rendering Panel](https://ostr.io/service/prerender) of a host, click on "Integration Guide".

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
# Run tests:
ROOT_URL=http://127.0.0.1:3003 npm test

# Run same tests with extra-logging
DEBUG=true ROOT_URL=http://127.0.0.1:3003 npm test
# http://127.0.0.1:3003 can be changed to any local address, PORT is required!
```
