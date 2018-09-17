# Spiderable middleware

Google, Facebook, Twitter, Yahoo, and Bing and all other crawlers and search engines are constantly trying to view your website. If your website is built on top of the JavaScript framework like, but not limited to - Angular, Backbone, Ember, Meteor, React, MEAN most of the front-end solutions returns basic HTML-markup and script-tags to crawlers, but not content of your page. The mission of `spiderable-middleware` and [ostr.io](https://ostr.io) are to boost your SEO experience without a headache.

## Why Pre-render?

- 🕸 Execute JavaScript, as web-crawlers and search engines can't run JS code;
- 🏃‍♂️ Boost response rate and decrease response time with caching;
- 🚀 Optimized HTML markup for best SEO score;
- 🖥 Support for PWAs and SPAs;
- ❤️ Search engines and social network crawlers love straightforward and pre-rendered pages;
- 📱 Consistent link previews in messaging apps, like iMessage, Messages, Facebook, Slack, Telegram, WhatsApp, Viber, VK, Twitter, etc.;
- 💻 Image, title, and description previews for posted links at social networks, like Facebook, Twitter, VK and others.

## About Package

This package acts as middleware and intercepts requests to your Node.js application from web crawlers. All requests proxy passed to the Prerendering Service, which returns static, rendered HTML.

  - __Note__: *This package proxies real HTTP headers and response code, to reduce overwhelming requests, try to avoid HTTP-redirect headers, like* `Location` *and others. Read how to [return genuine status code](https://github.com/VeliovGroup/spiderable-middleware#return-genuine-status-code) and [handle JS-redirects](https://github.com/VeliovGroup/spiderable-middleware#javascript-redirects).*
  - __Note__: This is __server only package__. For isomorphic environments, *like Meteor.js*, this package should be imported/initialized only at server code base.

This middleware was tested and works like a charm with:

  - [meteor](https://www.meteor.com/): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/meteor.middleware.js)
  - [express](https://www.npmjs.com/package/express): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/express.middleware.js)
  - [connect](https://www.npmjs.com/package/connect): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/connect.middleware.js)
  - [vanilla http(s) server](https://nodejs.org/api/http.html): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/http.middleware.js)
  - See [all examples](https://github.com/VeliovGroup/spiderable-middleware/tree/master/examples)

All other frameworks which follow Node's middleware convention - will work too.

This package was originally developed for [ostr.io](https://ostr.io) service. But it's not limited to, and can proxy-pass requests to any other rendering-endpoint.

## ToC

  - [Installation](https://github.com/VeliovGroup/spiderable-middleware#installation)
  - [Basic usage](https://github.com/VeliovGroup/spiderable-middleware#basic-usage)
  - [MeteorJS usage](https://github.com/VeliovGroup/spiderable-middleware#meteor-specific-usage)
  - [Return genuine status code](https://github.com/VeliovGroup/spiderable-middleware#return-genuine-status-code)
  - [Speed-up rendering](https://github.com/VeliovGroup/spiderable-middleware#speed-up-rendering)
  - [JavaScript redirects](https://github.com/VeliovGroup/spiderable-middleware#javascript-redirects)
  - [AMP Support](https://github.com/VeliovGroup/spiderable-middleware#amp-support)
  - [Rendering Endpoints](https://github.com/VeliovGroup/spiderable-middleware#rendering-endpoints)
  - [API](https://github.com/VeliovGroup/spiderable-middleware#api)
    - [Constructor](https://github.com/VeliovGroup/spiderable-middleware#constructor-new-spiderableopts)
    - [Middleware](https://github.com/VeliovGroup/spiderable-middleware#spiderablehandlerreq-res-next)
  - [Running Tests](https://github.com/VeliovGroup/spiderable-middleware#running-tests)
    - [Node.js/Mocha](https://github.com/VeliovGroup/spiderable-middleware#nodejsmocha)
    - [Meteor/Tinytest](https://github.com/VeliovGroup/spiderable-middleware#meteortinytest)

## Installation

### NPM:

```shell
npm install spiderable-middleware
```

### Meteor:

```shell
meteor add webapp
meteor add ostrio:spiderable-middleware
```

## Basic usage

See [all examples](https://github.com/VeliovGroup/spiderable-middleware/tree/master/examples).

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
const express    = require('express');
const app        = express();
const Spiderable = require('spiderable-middleware');
const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://render.ostr.io',
  auth: 'APIUser:APIPass'
});

app.use(spiderable.handler).get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000);
```

We provide various options for `serviceURL` as "[Rendering Endpoints](https://github.com/VeliovGroup/ostrio/blob/master/docs/prerendering/rendering-endpoints.md)", each has its own features, to fit every project needs.

## Meteor specific usage

```js
// meteor add webapp
// meteor add ostrio:spiderable-middleware
import { WebApp } from 'meteor/webapp';
import Spiderable from 'meteor/ostrio:spiderable-middleware';

WebApp.connectHandlers.use(new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://render.ostr.io',
  auth: 'APIUser:APIPass'
}));
```

## Return genuine status code

To pass expected response code from front-end JavaScript framework to browser/crawlers, you need to create specially formatted HTML-comment. This comment can be placed in any part of HTML-page. `head` or `body` tag is the best place for it.

Format (html):

```html
<!-- response:status-code=404 -->
```

Format (jade):

```jade
// response:status-code=404
```

This package support all standard and custom status codes:

  - `201` - `<!-- response:status-code=201 -->`
  - `401` - `<!-- response:status-code=401 -->`
  - `403` - `<!-- response:status-code=403 -->`
  - `499` - `<!-- response:status-code=499 -->` (*non-standard*)
  - `500` - `<!-- response:status-code=500 -->`
  - `514` - `<!-- response:status-code=514 -->` (*non-standard*)

__Note__: *Reserved status codes for internal service communications:* `49[0-9]`.

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

## JavaScript redirects

If you need to redirect browser/crawler inside your application, while a page is loading (*imitate navigation*), you're free to use any of classic JS-redirects as well as your framework's navigation, or `History.pushState()`

```js
window.location.href = 'http://example.com/another/page';
window.location.replace('http://example.com/another/page');

Router.go('/another/page'); // framework's navigation
```

__Note__: *Only 4 redirects are allowed during one request after 4 redirects session will be terminated.*

## API

### *Constructor* `new Spiderable([opts])`

  - `opts` {*Object*} - Configuration options
  - `opts.serviceURL` {*String*} - Valid URL to Spiderable endpoint (local or foreign). Default: `https://render.ostr.io`. Can be set via environment variables: `SPIDERABLE_SERVICE_URL` or `PRERENDER_SERVICE_URL`
  - `opts.rootURL` {*String*} - Valid root URL of your website. Can be set via an environment variable: `ROOT_URL` (*common for meteor*)
  - `opts.auth` {*String*} - [Optional] Auth string in next format: `user:pass`. Can be set via an environment variables: `SPIDERABLE_SERVICE_AUTH` or `PRERENDER_SERVICE_AUTH`. Default `null`
  - `opts.bots` {*[String]*} - [Optional] An array of strings (case insensitive) with additional User-Agent names of crawlers you would like to intercept. See default [bot's names](https://github.com/VeliovGroup/spiderable-middleware/blob/master/lib/index.js#L106)
  - `opts.ignore` {*[String]*} - [Optional] An array of strings (case __sensitive__) with ignored routes. Note: it's based on first match, so route `/users` will cause ignoring of `/part/users/part`, `/users/_id` and `/list/of/users`, but not `/user/_id` or `/list/of/blocked-users`. Default `null`
  - `opts.only` {*[String|RegExp]*} - [Optional] An array of strings (case __sensitive__) or regular expressions (*could be mixed*). Define __exclusive__ route rules for prerendering. Could be used with `opts.onlyRE` rules. __Note:__ To define "safe" rules as {*RegExp*} it should start with `^` and end with `$` symbols, examples: `[/^\/articles\/?$/, /^\/article/[A-z0-9]{16}\/?$/]`
  - `opts.onlyRE` {*RegExp*} - [Optional] Regular Expression with __exclusive__ route rules for prerendering. Could be used with `opts.only` rules

__Note:__ *Setting* `.onlyRE` *and/or* `.only` *rules are highly recommended. Otherwise, all routes, including randomly generated by bots will be subject of Prerendering and may cause unexpectedly higher usage.*

```js
// CommonJS
// const Spiderable = require('spiderable-middleware');

// Meteor.js
// import Spiderable from 'meteor/ostrio:spiderable-middleware';

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://render.ostr.io',
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

### `spiderable.handler(req, res, next)`

*Middleware handler. Alias:* `spiderable.handle`.

```js
// Express, Connect:
app.use(spiderable.handler);

// Meteor:
WebApp.connectHandlers.use(spiderable);

//HTTP(s) Server
http.createServer((req, res) => {
  spiderable.handler(req, res, () => {
    // Callback, triggered if this request
    // is not a subject of spiderable prerendering
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end('Hello vanilla NodeJS!');
    // Or do something else ...
  });
}).listen(3000);
```

## AMP Support

To properly serve pages for [Accelerated Mobile Pages](https://www.ampproject.org) (AMP) we support following URI schemes:

```shell
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

To change default endpoint, grab [integration examples code](https://github.com/VeliovGroup/spiderable-middleware/tree/master/examples) and replace `render.ostr.io`, with endpoint of your choice. For NPM/Meteor integration change value of [`serviceURL`](https://github.com/VeliovGroup/spiderable-middleware#basic-usage) option.

__Note:__ Described differences in caching behavior is only about intermediate proxy caching, `Cache-Control` header will be always set to the value defined in "Cache TTL". Cached results at the "Prerendering Engine" end can be [purged at any time](https://github.com/VeliovGroup/ostrio/blob/master/docs/prerendering/cache-purge.md).

## Running Tests

 1. Clone this package
 2. In Terminal (*Console*) go to directory where package is cloned
 3. Then run:

### Node.js/Mocha

```shell
# Install development NPM dependencies:
npm install --save-dev
# Install NPM dependencies:
npm install --save
# Run tests:
ROOT_URL=http://127.0.0.1:3003 npm test
# http://127.0.0.1:3003 can be changed to any local address, PORT is required!
```

### Meteor/Tinytest

```shell
meteor test-packages ./ --port 3003
# PORT is required, and can be changed to any local open port
```
