Google, Facebook, Twitter, Yahoo, and Bing and all other crawlers and search engines are constantly trying to view your website. If your website build on top of JavaScript framework like, but not limited to - Angular, Backbone, Ember, Meteor all of those front-end solutions returns basic HTML-markup and script-tags to crawlers, but not content of your page. Mission of `spiderable-middleware` is boost your SEO experience without headache.

This middleware intercepts requests to your Node.js website from crawlers, and proxy-passes to the Spiderable (Prerender) Service, which returns static, rendered HTML.

This middleware tested and works like a charm with:
 - [meteor](https://www.meteor.com/): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/meteor.middleware.js)
 - [express](https://www.npmjs.com/package/express): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/express.middleware.js)
 - [connect](https://www.npmjs.com/package/connect): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/connect.middleware.js)
 - [vanilla http(s) server](https://nodejs.org/api/http.html): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/http.middleware.js)
 - See [all examples](https://github.com/VeliovGroup/spiderable-middleware/tree/master/examples)

All other frameworks which follows node's middleware convention - will work too!

This package was developed to be used with [ostr.io](https://ostr.io) service. But it's not limited to and can proxy-pass requests to any other endpoint

Installation
=======
```shell
npm install spiderable-middleware
```

Basic usage
=======
```js
var express    = require('express');
var app        = express();
var Spiderable = require('spiderable-middleware');
var spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://trace.ostr.io',
  auth: 'APIUser:APIPass'
});

app.use(spiderable.handler).get('/', function (req, res) {
  res.send('Hello World');
});

app.listen(3000);
```

Meteor usage
=======
```js
// meteor add ostrio:spiderable-middleware

WebApp.connectHandlers.use(new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://trace.ostr.io',
  auth: 'APIUser:APIPass'
}));
```

API
=======

##### *Constructor* `new Spiderable([opts])`

 - `opts` {*Object*} - Configuration options
 - `opts.serviceURL` {*String*} - Valid URL to Spiderable endpoint (local or foreign). Default: `https://trace.ostr.io`. Can be set via environment variables: `SPIDERABLE_SERVICE_URL` and `PRERENDER_SERVICE_URL`
 - `opts.rootURL` {*String*} - Valid root URL of your website. Can be set via environment variable: `ROOT_URL` (*common for meteor*)
 - `opts.auth` {*String*} - [Optional] Auth string in next format: `user:pass`. Default `null`
 - `opts.bots` {*[String]*} - [Optional] Array of strings (case insensitive) with additional User-Agent names of crawlers you would like to intercept. See default [bot's names](https://github.com/VeliovGroup/spiderable-middleware/blob/master/src/index.coffee#9)
 - `opts.ignore` {*[String]*} - [Optional] Array of strings (case __sensitive__) with ignored routes. Note: it's based on first match, so route `/users` will cause ignoring of `/part/users/part`, `/users/_id` and `/list/of/users`, but not `/user/_id` or `/list/of/blocked-users`. Default `null`

```js
var Spiderable = require('spiderable-middleware');
var spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://trace.ostr.io',
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
http.createServer(function(req, res) {
  spiderable.handler(req, res, function(){
    // Callback, triggered if this request
    // is not a subject of spiderable prerendering
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end("Hello vanilla NodeJS!");
    // Or do something else ...
  });
}).listen(3000);
```
