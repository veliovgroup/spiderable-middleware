var url     = require('url');
var request = require('request');
module.exports = (function() {
  function Spiderable(opts) {
    if (opts == null) {
      opts = {};
    }

    var bots        = opts.bots;
    this.auth       = opts.auth;
    var ignore      = opts.ignore;
    this.rootURL    = opts.rootURL;
    this.serviceURL = opts.serviceURL;

    if (!this.handler) {
      this.handler = this.middleware;
    }
    if (!this.handle) {
      this.handle = this.middleware;
    }

    var defBots = ['googlebot', 'yahoo', 'bingbot', 'facebookexternalhit', 'twitterbot', 'rogerbot', 'linkedinbot', 'embedly', 'quora link preview', 'showyoubot', 'outbrain', 'pinterest', 'developers.google.com/+/web/snippet', 'slackbot', 'vkShare', 'W3C_Validator', 'redditbot', 'Applebot', 'WhatsApp', 'flipboard', 'yandex', 'google-structured-data-testing-tool', 'MJ12Bot', 'tweetmemeBot', 'baiduSpider', 'Mail\.RU_Bot', 'ahrefsBot', 'SiteLockSpider', 'visionutils', 'tumblr', 'bitlybot', 'SkypeUriPreview', 'nuzzel', 'Discordbot'];

    if (bots) {
      defBots = defBots.concat(bots);
    }

    this.botsRE = new RegExp(defBots.join('|'), 'i');
    if (!this.auth) {
      this.auth = process.env.SPIDERABLE_SERVICE_AUTH || process.env.PRERENDER_SERVICE_AUTH || '';
    }

    if (!ignore || Object.prototype.toString.call(ignore) !== '[object Array]') {
      ignore = false;
    }

    if (!this.rootURL) {
      this.rootURL = process.env.ROOT_URL;
    }

    if (!this.serviceURL) {
      this.serviceURL = process.env.SPIDERABLE_SERVICE_URL || process.env.PRERENDER_SERVICE_URL || 'https://render.ostr.io';
    }

    if (!this.rootURL) {
      throw new Error('[Spiderable-Middleware] {rootURL} or env variable ROOT_URL is not detected! But must be specified!');
    }

    if (!this.serviceURL) {
      throw new Error('[Spiderable-Middleware] {serviceURL} or env variable SPIDERABLE_SERVICE_URL or PRERENDER_SERVICE_URL is not detected! But must be specified!');
    }

    if (!/^http(s)?:\/\//i.test(this.rootURL)) {
      throw new Error('[Spiderable-Middleware] {rootURL} is malformed! Must start with protocol http or https');
    }

    if (!/^http(s)?:\/\//i.test(this.serviceURL)) {
      throw new Error('[Spiderable-Middleware] {serviceURL} is malformed! Must start with protocol http or https');
    }

    this.rootURL    = this.rootURL.replace(/\/$/, '').replace(/^\//, '');
    this.serviceURL = this.serviceURL.replace(/\/$/, '').replace(/^\//, '');

    request.defaults({
      proxy: this.serviceURL
    });

    if (ignore) {
      this.ignoreRE = new RegExp(ignore.join('|'), '');
    } else {
      this.ignoreRE = false;
    }
  }

  Spiderable.prototype.middleware = function(req, res, next) {
    var urlObj     = url.parse(req.url, true);
    var hasIgnored = false;

    if (req.method.toLowerCase() !== 'get' && req.method.toLowerCase() !== 'head') {
      return next();
    }

    if (this.ignoreRE && this.ignoreRE.test(req.url)) {
      hasIgnored = true;
    }

    if ((urlObj.query._escaped_fragment_ !== void 0 || this.botsRE.test(req.headers['user-agent'])) && !hasIgnored) {
      var reqUrl = this.rootURL;

      urlObj.path = urlObj.path.replace(/\/$/, '').replace(/^\//, '');
      if (urlObj.query._escaped_fragment_ !== void 0 && urlObj.query._escaped_fragment_.length) {
        urlObj.pathname += '/' + urlObj.query._escaped_fragment_.replace(/^\//, '');
      }

      reqUrl += '/' + urlObj.pathname;
      reqUrl  = reqUrl.replace(/([^:]\/)\/+/g, '$1');
      var opts  = {
        url: (this.serviceURL + '/?url=' + encodeURIComponent(reqUrl)).replace(/([^:]\/)\/+/g, '$1')
      };

      if (this.auth && this.auth.length && !!~this.auth.indexOf(':')) {
        var _as = this.auth.split(':');
        opts.auth = {
          user: _as[0],
          pass: _as[1]
        };
      }

      try {
        req.on('error', function(error) {
          console.warn('[Spiderable-Middleware] [REQ] Unexpected error:', error);
          next();
        });

        res.on('error', function(error) {
          console.warn('[Spiderable-Middleware] [RES] Unexpected error:', error);
          next();
        });

        request.get(opts, function(error) {
          if (error) {
            console.warn('[Spiderable-Middleware] [request.get] Error while connecting to external service:', error);
            next();
          }
        }).on('response', function(response) {
          if (response.statusCode === 401) {
            console.warn('[Spiderable-Middleware] Can\'t authenticate! Please check you "auth" parameter and other settings.');
          }
        }).pipe(res).on('error', function(error) {
          console.warn('[Spiderable-Middleware] Unexpected error:', error);
          next();
        });
      } catch (e) {
        console.warn('[Spiderable-Middleware] Exception while connecting to external service:', e);
        next();
      }
      return true;
    }
    return next();
  };

  return Spiderable;
})();
