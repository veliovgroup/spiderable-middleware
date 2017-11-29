Spiderable middleware
=======
Google, Facebook, Twitter, Yahoo, and Bing and all other crawlers and search engines are constantly trying to view your website. If your website is built on top of the JavaScript framework like, but not limited to - Angular, Backbone, Ember, Meteor, React, MEAN most of the front-end solutions returns basic HTML-markup and script-tags to crawlers, but not content of your page. The mission of `spiderable-middleware` and [ostr.io](https://ostr.io) are to boost your SEO experience without a headache.


## About Package

This package acts as middleware and intercepts requests to your Node.js application from web crawlers. All requests proxy passed to the Spiderable (Prerender) Service, which returns static, rendered HTML.

__Note__: *This package proxies real HTTP headers and response code, to reduce overwhelming requests, try to avoid HTTP-redirect headers, like* `Location` *and others. Read how to [return genuine status code](https://github.com/VeliovGroup/spiderable-middleware#return-genuine-status-code) and [handle JS-redirects](https://github.com/VeliovGroup/spiderable-middleware#javascript-redirects).*

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
 - [API](https://github.com/VeliovGroup/spiderable-middleware#api)
   - [Constructor](https://github.com/VeliovGroup/spiderable-middleware#constructor-new-spiderableopts)
   - [Middleware](https://github.com/VeliovGroup/spiderable-middleware#spiderablehandlerreq-res-next)
 - [Running Tests](https://github.com/VeliovGroup/spiderable-middleware#running-tests)
   - [Node.js/Mocha](https://github.com/VeliovGroup/spiderable-middleware#nodejsmocha)
   - [Meteor/Tinytest](https://github.com/VeliovGroup/spiderable-middleware#meteortinytest)

## Installation

##### NPM:
```shell
npm install spiderable-middleware
```

##### Meteor:
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

## Meteor specific usage

```js
// meteor add webapp
// meteor add ostrio:spiderable-middleware

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

##### *Constructor* `new Spiderable([opts])`

 - `opts` {*Object*} - Configuration options
 - `opts.serviceURL` {*String*} - Valid URL to Spiderable endpoint (local or foreign). Default: `https://render.ostr.io`. Can be set via environment variables: `SPIDERABLE_SERVICE_URL` or `PRERENDER_SERVICE_URL`
 - `opts.rootURL` {*String*} - Valid root URL of your website. Can be set via an environment variable: `ROOT_URL` (*common for meteor*)
 - `opts.auth` {*String*} - [Optional] Auth string in next format: `user:pass`. Can be set via an environment variables: `SPIDERABLE_SERVICE_AUTH` or `PRERENDER_SERVICE_AUTH`. Default `null`
 - `opts.bots` {*[String]*} - [Optional] An array of strings (case insensitive) with additional User-Agent names of crawlers you would like to intercept. See default [bot's names](https://github.com/VeliovGroup/spiderable-middleware/blob/master/lib/index.js#L93)
 - `opts.ignore` {*[String]*} - [Optional] An array of strings (case __sensitive__) with ignored routes. Note: it's based on first match, so route `/users` will cause ignoring of `/part/users/part`, `/users/_id` and `/list/of/users`, but not `/user/_id` or `/list/of/blocked-users`. Default `null`

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
```

##### `spiderable.handler(req, res, next)`
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
    res.end("Hello vanilla NodeJS!");
    // Or do something else ...
  });
}).listen(3000);
```

## Running Tests

 1. Clone this package
 2. In Terminal (*Console*) go to directory where package is cloned
 3. Then run:

##### Node.js/Mocha
```shell
ROOT_URL=http://127.0.0.1:3003 npm test
# http://127.0.0.1:3003 can be changed to any local address, PORT is required!
```

##### Meteor/Tinytest
```shell
meteor test-packages ./ --port 3003
# PORT is required, and can be changed to any local open port
```