Google, Facebook, Twitter, Yahoo, and Bing and all other crawlers and search engines are constantly trying to view your website. If your website build on top of JavaScript framework like, but not limited to - Angular, Backbone, Ember, Meteor all of those front-end solutions returns basic HTML-markup and script-tags to crawlers, but not content of your page. Mission of `spiderable-middleware` and [ostr.io](https://ostr.io) - is boost your SEO experience without headache.

This middleware intercepts requests to your Node.js website from crawlers, and proxy-passes to the Spiderable (Prerender) Service, which returns static, rendered HTML.

__Note__: *This package proxy-passes real HTTP Headers and response code, to reduce overwhelming requests, try to avoid HTTP-redirect headers, like* `Location` *and others. See how to [pass expected response code](https://github.com/VeliovGroup/spiderable-middleware#pass-real-response-code) and [handle JS-redirects](https://github.com/VeliovGroup/spiderable-middleware#javascript-redirects).*

This middleware tested and works like a charm with:
 - [meteor](https://www.meteor.com/): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/meteor.middleware.js)
 - [express](https://www.npmjs.com/package/express): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/express.middleware.js)
 - [connect](https://www.npmjs.com/package/connect): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/connect.middleware.js)
 - [vanilla http(s) server](https://nodejs.org/api/http.html): [example](https://github.com/VeliovGroup/spiderable-middleware/blob/master/examples/http.middleware.js)
 - See [all examples](https://github.com/VeliovGroup/spiderable-middleware/tree/master/examples)

All other frameworks which follows node's middleware convention - will work too!

This package was developed to be used with [ostr.io](https://ostr.io) service. But it's not limited to, and can proxy-pass requests to any other endpoint.

ToC
=======
 - [Installation](https://github.com/VeliovGroup/spiderable-middleware#installation)
 - [Basic usage](https://github.com/VeliovGroup/spiderable-middleware#basic-usage)
 - [MeteorJS usage](https://github.com/VeliovGroup/spiderable-middleware#meteor-usage)
 - [Pass real response code](https://github.com/VeliovGroup/spiderable-middleware#pass-real-response-code)
 - [Speed-up rendering](https://github.com/VeliovGroup/spiderable-middleware#speed-up-rendering)
 - [JavaScript redirects](https://github.com/VeliovGroup/spiderable-middleware#javascript-redirects)
 - [API](https://github.com/VeliovGroup/spiderable-middleware#api)
   - [Constructor](https://github.com/VeliovGroup/spiderable-middleware#constructor-new-spiderableopts)
   - [Middleware](https://github.com/VeliovGroup/spiderable-middleware#spiderablehandlerreq-res-next)

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

Pass real response code
=======
To pass expected response code from front-end JavaScript framework to browser/crawlers, you need to create specially formatted HTML-comment. This comment can be placed to any part of HTML-page, `head` or `body` tags is best place for it.

Format (html):
```html
<!-- response:status-code=404 -->
```

Format (jade):
```jade
// response:status-code=404
```

It supports any standard or custom response codes:
 - `201` - `<!-- response:status-code=201 -->`
 - `401` - `<!-- response:status-code=401 -->`
 - `403` - `<!-- response:status-code=403 -->`
 - `499` - `<!-- response:status-code=499 -->` (*non-standard*)
 - `500` - `<!-- response:status-code=500 -->`
 - `514` - `<!-- response:status-code=514 -->` (*non-standard*)

__Note__: *Reserved codes for internal service communications:* `494`, `490`

Speed-up rendering
=======
To speed-up rendering, you can tell to Spiderable engine when your page is ready. Simply set `window.IS_RENDERED` to `false`, and once your page is ready set it to `true`. Like:

```js
<html>
  <head>
    <script>
      window.IS_RENDERED = false;
    </script>
    <script type="text/javascript">
      //Somewhere deep in your app-code:
      window.IS_RENDERED = true;
    </script>
  </head>
  <!-- ... -->
</html>
```

JavaScript redirects
=======
If you need to redirect browser/crawler inside your application, during the rendering (*imitate user is navigating*), you're free to use any of classic JS-redirects as well as your framework's navigation, or even `History.pushState()`
```js
window.location.href = 'http://example.com/another/page';
window.location.replace('http://example.com/another/page');

Router.go('/another/page'); // framework's navigation
```
__Note__: *Only 4 redirects is allowed during one request, after 4 redirects session will be terminated.*


API
=======

##### *Constructor* `new Spiderable([opts])`

 - `opts` {*Object*} - Configuration options
 - `opts.serviceURL` {*String*} - Valid URL to Spiderable endpoint (local or foreign). Default: `https://trace.ostr.io`. Can be set via environment variables: `SPIDERABLE_SERVICE_URL` and `PRERENDER_SERVICE_URL`
 - `opts.rootURL` {*String*} - Valid root URL of your website. Can be set via environment variable: `ROOT_URL` (*common for meteor*)
 - `opts.auth` {*String*} - [Optional] Auth string in next format: `user:pass`. Default `null`
 - `opts.bots` {*[String]*} - [Optional] Array of strings (case insensitive) with additional User-Agent names of crawlers you would like to intercept. See default [bot's names](https://github.com/VeliovGroup/spiderable-middleware/blob/master/src/index.coffee#L9)
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
