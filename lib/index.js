var https = require('https');

if (typeof window !== 'undefined') {
  throw new Error('Running `spiderable-middleware` in Browser environment isn\'t allowed! Please make sure `spiderable-middleware` NPM package is imported and used only in Node.js environment.');
}

var keepAliveAgent = new https.Agent({
  keepAlive: true,
  timeout: 190000,
});

var nullBuf = Buffer.from('');

var strs = {
  authBasic: 'Basic ',
  caseInsensitive: 'i',
  empty: '',
  escapedFragment: '_escaped_fragment_',
  get: 'get',
  head: 'head',
  pipe: '|',
  semicolon: ':',
  slash: '/',
  string: 'string',
  ua: 'user-agent',
  objs: {
    array: '[object Array]',
    regexp: '[object RegExp]',
    object: '[object Object]',
    string: '[object String]'
  },
  queryArgs: {
    url: '/?url=',
    bot: '&bot=',
  },
  enc: {
    base64: 'base64',
  },
};

var packageDetails = require('../package.json');

var re = {
  newLine: /\r|\n/,
  proto: /^https?:\/\//i,
  trailingSlash: /\/$/,
  beginningSlash: /^\//,
  digit: /\d+/,
  staticExt: /\.(?:3ds|3g2|3gp|3gpp|7z|a|aac|aaf|adp|ai|aif|aiff|alz|ape|apk|appcache|ar|arj|asf|asx|atom|au|avchd|avi|bak|bbaw|bh|bin|bk|bmp|btif|bz2|bzip2|cab|caf|cco|cgm|class|cmx|cpio|cr2|crt|crx|css|csv|cur|dat|deb|der|dex|djvu|dll|dmg|dng|doc|docm|docx|dot|dotm|dra|drc|DS_Store|dsk|dts|dtshd|dvb|dwg|dxf|ear|ecelp4800|ecelp7470|ecelp9600|egg|eol|eot|eps|epub|exe|f4a|f4b|f4p|f4v|fbs|fh|fla|flac|fli|flv|fpx|fst|fvt|g3|geojson|gif|graffle|gz|gzip|h261|h263|h264|hqx|htc|ico|ief|img|ipa|iso|jad|jar|jardiff|jng|jnlp|jpeg|jpg|jpgv|jpm|js|jxr|key|kml|kmz|ktx|less|lha|lvp|lz|lzh|lzma|lzo|m2v|m3u|m4a|m4p|m4v|map|manifest|mar|markdown|md|mdi|mdown|mdwn|mht|mid|midi|mj2|mka|mkd|mkdn|mkdown|mkv|mml|mmr|mng|mobi|mov|movie|mp2|mp3|mp4|mp4a|mpe|mpeg|mpg|mpga|mpv|msi|msm|msp|mxf|mxu|nef|npx|nsv|numbers|o|oex|oga|ogg|ogv|opus|otf|pages|pbm|pcx|pdb|pdf|pea|pem|pgm|pic|pl|pm|png|pnm|pot|potm|potx|ppa|ppam|ppm|pps|ppsm|ppsx|ppt|pptm|pptx|prc|ps|psd|pya|pyc|pyo|pyv|qt|ra|rar|ras|raw|rdf|rgb|rip|rlc|rm|rmf|rmvb|ron|roq|rpm|rss|rtf|run|rz|s3m|s7z|safariextz|scpt|sea|sgi|shar|sil|sit|slk|smv|so|sub|svg|svgz|svi|swf|tar|tbz|tbz2|tcl|tga|tgz|thmx|tif|tiff|tk|tlz|topojson|torrent|ttc|ttf|txt|txz|udf|uvh|uvi|uvm|uvp|uvs|uvu|vcard|vcf|viv|vob|vtt|war|wav|wax|wbmp|wdp|weba|webapp|webm|webmanifest|webp|whl|wim|wm|wma|wml|wmlc|wmv|wmx|woff|woff2|wvx|xbm|xif|xla|xlam|xloc|xls|xlsb|xlsm|xlsx|xlt|xltm|xltx|xm|xmind|xml|xpi|xpm|xsl|xwd|xz|yuv|z|zip|zipx)(?:\?[a-zA-Z0-9\-\.\_\~\:\/\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]*)?$/i
};

var isObject = function (obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

var _warn = function warn (...args) {
  console.warn.call(console, '[WARN] [Spiderable-Middleware]', ...args);
};

var _info = function info (...args) {
  console.info.call(console, '[INFO] [Spiderable-Middleware]', ...args);
};

var _debug = function () {};

/** Class representing a Spiderable */
module.exports = (function () {
  /**
   * Create a Spiderable instance
   * @param {object} opts - configuration object
   */
  function Spiderable(_opts) {
    var opts = {};
    if (_opts && Object.prototype.toString.call(_opts) === strs.objs.object) {
      opts = _opts;
    }

    this.userAgent = 'spiderable-middleware/' + packageDetails.version;
    this.auth = opts.auth;
    this.debug = opts.debug || process.env.DEBUG === 'true' || process.env.DEBUG === true || false;
    var ignore = opts.ignore || false;
    this.only = opts.only || false;
    this.onlyRE = opts.onlyRE || false;
    this.botsUA = opts.botsUA || Spiderable.prototype.botsUA;
    this.rootURL = opts.rootURL || process.env.ROOT_URL;
    this.timeout = opts.timeout || 180000;
    this.staticExt = opts.staticExt || re.staticExt;
    this.serviceURL = opts.serviceURL || process.env.SPIDERABLE_SERVICE_URL || process.env.PRERENDER_SERVICE_URL || 'https://render.ostr.io';
    this.sanitizeUrls = opts.sanitizeUrls || false;
    this.ignoredHeaders = opts.ignoredHeaders || Spiderable.prototype.ignoredHeaders;
    this.requestOptions = opts.requestOptions || {};

    if (Object.prototype.toString.call(this.staticExt) !== strs.objs.regexp) {
      _warn('`opts.staticExt` must be instance of RegExp, falling back to defaults.');
      this.staticExt = re.staticExt;
    }

    if (this.onlyRE && Object.prototype.toString.call(this.onlyRE) !== strs.objs.regexp) {
      _warn('`opts.onlyRE` must be instance of RegExp, rules are ignored!');
      this.onlyRE = false;
    }

    if (Object.prototype.toString.call(this.botsUA) !== strs.objs.array) {
      _warn('`opts.botsUA` must be instance of Array, falling back to defaults.');
      this.botsUA = this.prototype.botsUA;
    }

    if (Object.prototype.toString.call(this.ignoredHeaders) !== strs.objs.array) {
      _warn('`opts.ignoredHeaders` must be instance of Array, falling back to defaults.');
      this.ignoredHeaders = this.prototype.ignoredHeaders;
    }

    if (this.only && Object.prototype.toString.call(this.only) !== strs.objs.array) {
      _warn('`opts.only` must be instance of Array, rules are ignored!');
      this.only = false;
    }

    if (this.debug) {
      _debug = function (...args) {
        _info('[DEBUG]', ...args);
      };
    }

    if (!this.handler) {
      this.handler = this.middleware;
    }

    if (!this.handle) {
      this.handle = this.middleware;
    }

    this.headersRE = new RegExp('^(' + this.ignoredHeaders.join(strs.pipe) + ')$', strs.caseInsensitive);
    this.botsRE = new RegExp(this.botsUA.join(strs.pipe), strs.caseInsensitive);
    if (!this.auth) {
      this.auth = process.env.SPIDERABLE_SERVICE_AUTH || process.env.PRERENDER_SERVICE_AUTH || strs.empty;
    }

    if (ignore && Object.prototype.toString.call(ignore) !== strs.objs.array) {
      _warn('`opts.ignore` must be instance of Array, rules are ignored!');
      ignore = false;
    }

    if (!this.rootURL) {
      throw new Error('{rootURL} or env variable ROOT_URL is not detected! But must be specified!');
    }

    if (!this.serviceURL) {
      throw new Error('{serviceURL} or env variable SPIDERABLE_SERVICE_URL or PRERENDER_SERVICE_URL is not detected! But must be specified!');
    }

    if (!re.proto.test(this.rootURL)) {
      throw new Error('{rootURL} is malformed! Must start with http or https protocol');
    }

    if (!re.proto.test(this.serviceURL)) {
      throw new Error('{serviceURL} is malformed! Must start with http or https protocol');
    }

    this.rootURL = this.rootURL.replace(re.trailingSlash, strs.empty).replace(re.beginningSlash, strs.empty);
    this.serviceURL = this.serviceURL.replace(re.trailingSlash, strs.empty).replace(re.beginningSlash, strs.empty);

    if (ignore) {
      this.ignoreRE = new RegExp(ignore.join(strs.pipe), strs.empty);
    } else {
      this.ignoreRE = false;
    }

    this.debug && _debug('Spiderable class initiated', this);
  }

  /**
   * @memberOf Spiderable
   * Array of bots and crawlers user agents
   * @name botsUA
   * @type {string[]}
   */
  Spiderable.prototype.botsUA = ['\\.net crawler', '360spider', '50\\.nu', '8bo crawler bot', 'aboundex', 'accoona', 'adldxbot', 'adsbot-google', 'ahrefsbot', 'altavista', 'appengine-google', 'applebot', 'archiver', 'arielisbot', 'ask jeeves', 'auskunftbot', 'baidumobaider', 'baiduspider', 'becomebot', 'bingbot', 'bingpreview', 'bitbot', 'bitlybot', 'blitzbot', 'blogbridge', 'boardreader', 'botseer', 'catchbot', 'catchpoint bot', 'charlotte', 'checklinks', 'cliqzbot', 'clumboot', 'coccocbot', 'converacrawler', 'crawl-e', 'crawlconvera', 'dataparksearch', 'daum', 'deusu', 'developers\\.google\\.com/+/web/snippet', 'discordbot', 'dotbot', 'duckduckbot', 'elefent', 'embedly', 'evernote', 'exabot', 'facebookbot', 'facebookexternalhit', 'fatbot', 'fdse robot', 'feed seeker bot', 'feedfetcher', 'femtosearchbot', 'findlinks', 'flamingo_searchengine', 'flipboard', 'followsite bot', 'furlbot', 'fyberspider', 'gaisbot', 'galaxybot', 'geniebot', 'genieo', 'gigablast', 'gigabot', 'girafabot', 'gomezagent', 'gonzo1', 'google sketchup', 'google-structured-data-testing-tool', 'googlebot', 'haosouspider', 'heritrix', 'holmes', 'hoowwwer', 'htdig', 'ia_archiver', 'idbot', 'infuzapp', 'innovazion crawler', 'internetarchive', 'iqdb', 'iskanie', 'istellabot', 'izsearch\\.com', 'kaloogabot', 'kaz\\.kz_bot', 'kd bot', 'konqueror', 'kraken', 'kurzor', 'larbin', 'leia', 'lesnikbot', 'linguee bot', 'linkaider', 'linkapediabot', 'linkedinbot', 'lite bot', 'llaut', 'lookseek', 'lycos', 'mail\\.ru_bot', 'masidani_bot', 'masscan', 'mediapartners-google', 'metajobbot', 'mj12bot', 'mnogosearch', 'mogimogi', 'mojeekbot', 'motominerbot', 'mozdex', 'msiecrawler', 'msnbot', 'msrbot', 'netpursual', 'netresearch', 'netvibes', 'newsgator', 'ng-search', 'nicebot', 'nutchcvs', 'nuzzel', 'nymesis', 'objectssearch', 'odklbot', 'omgili', 'oovoo', 'oozbot', 'openfosbot', 'orangebot', 'orbiter', 'org_bot', 'outbrain', 'pagepeeker', 'pagesinventory', 'parsijoobot', 'paxleframework', 'peeplo screenshot bot', 'pinterest', 'plantynet_webrobot', 'plukkie', 'pompos', 'psbot', 'quora link preview', 'qwantify', 'read%20later', 'reaper', 'redcarpet', 'redditbot', 'retreiver', 'riddler', 'rival iq', 'rogerbot', 'saucenao', 'scooter', 'scrapy', 'scrubby', 'searchie', 'searchsight', 'seekbot', 'semanticdiscovery', 'seznambot', 'showyoubot', 'simplepie', 'simpy', 'sitelockspider', 'skypeuripreview', 'slack-imgproxy', 'slackbot', 'slurp', 'snappy', 'sogou', 'solofield', 'speedy spider', 'speedyspider', 'sputnikbot', 'stackrambler', 'teeraidbot', 'teoma', 'theusefulbot', 'thumbshots\\.ru', 'thumbshotsbot', 'tineye', 'toweya\\.com', 'toweyabot', 'tumblr', 'tweetedtimes', 'tweetmemebot', 'twitterbot', 'url2png', 'vagabondo', 'vebidoobot', 'viber', 'visionutils', 'vkshare', 'voilabot', 'vortex', 'votay bot', 'voyager', 'w3c_validator', 'wasalive\\.bot', 'web-sniffer', 'websquash\\.com', 'webthumb', 'whatsapp', 'whatweb', 'wire', 'wotbox', 'yacybot', 'yahoo', 'yandex', 'yeti', 'yisouspider', 'yodaobot', 'yooglifetchagent', 'yoozbot', 'yottaamonitor', 'yowedo', 'zao-crawler', 'zebot_www\\.ze\\.bz', 'zooshot', 'zyborg'];

  /**
   * @memberOf Spiderable
   * Array of ignored headers
   * @name ignoredHeaders
   * @type {string[]}
   */
  Spiderable.prototype.ignoredHeaders = ['age', 'alt-svc', 'cache-status', 'cf-connecting-ip', 'cf-ipcountry', 'cf-cache-status', 'cf-ray', 'cf-request-id', 'cnection', 'cneonction', 'connection', 'content-encoding', 'content-length', 'date', 'etag', 'expect-ct', 'expires', 'keep-alive', 'last-modified', 'link', 'nel', 'nncoection', 'pragma', 'server', 'set-cookie', 'status', 'transfer-encoding', 'report-to', 'vary', 'via', 'www-authenticate', 'x-accel-buffering', 'x-accel-charset', 'x-accel-expires', 'x-accel-limit-rate', 'x-accel-redirect', 'x-ostrio-domain', 'x-powered-by', 'x-preprender-status', 'x-prerender-status', 'x-real-ip', 'x-runtime'];

  /**
   * @memberOf Spiderable
   * Get complete URL to send request to rendering endpoint
   * @name getServiceURL
   * @param {URL} urlObj - URL instance returned from `getRequestURL()` method
   * @param {string|undefined} bua - Bot User Agent string from request headers
   * @returns {string}
   */
  Spiderable.prototype.getServiceURL = function (urlObj, bua) {
    var botUA = bua ? bua : '';
    var reqUrl = this.rootURL;
    reqUrl += strs.slash + urlObj.pathname.replace(re.beginningSlash, strs.empty);
    // reqUrl = reqUrl.replace(/([^:]\/)\/+/g, '$1');
    reqUrl = (this.serviceURL + strs.queryArgs.url + encodeURIComponent(reqUrl));

    if (typeof botUA === strs.string && botUA.length) {
      reqUrl += strs.queryArgs.bot + encodeURIComponent(botUA);
    }

    return reqUrl;
  };

  /**
   * @memberOf Spiderable
   * Check request and return complete origin URL if valid
   * @name getRequestURL
   * @param {IncomingMessage} req - Original IncomingMessage of node.js server
   * @returns {string|false}
   */
  Spiderable.prototype.getRequestURL = function (req) {
    var path = req.url;
    if (this.sanitizeUrls) {
      path = path.replace(/\/+/g, strs.slash);
    }

    var urlObj;
    try {
      urlObj = new URL(path, this.rootURL);
    } catch (e) {
      // BAD URL IS PASSED!
      // IGNORING AND PASSING DOWN TO THE APP
      this.debug && _debug('[getRequestURL] [bad url]', path, req.url);
      return false;
    }

    urlObj.pathname = urlObj.pathname.replace(re.beginningSlash, strs.empty);
    var escapedFragment = urlObj.searchParams.has(strs.escapedFragment) ? urlObj.searchParams.get(strs.escapedFragment) : false;
    if (escapedFragment) {
      if (typeof escapedFragment === strs.string && escapedFragment.length) {
        urlObj.pathname += strs.slash + (escapedFragment.replace(re.beginningSlash, strs.empty));
      }
    }

    this.debug && _debug('[getRequestURL] URL:', urlObj.toString());

    if (escapedFragment === false || !this.botsRE.test(req.headers[strs.ua] || strs.empty)) {
      return false;
    }
    return urlObj;
  };

  /**
   * @memberOf Spiderable
   * Check request and return complete origin URL if valid
   * @name middleware
   * @param {IncomingMessage} req - Original IncomingMessage of node.js server
   * @param {ServerResponse} res - Writable ServerResponse
   * @param {function} next - Function that will be called to skip this middleware and process the next one
   * @returns {boolean}
   */
  Spiderable.prototype.middleware = function (req, res, next) {
    var method = req.method.toLowerCase();
    if (method !== strs.get && method !== strs.head) {
      next();
      return false;
    }

    var urlObj = this.getRequestURL(req);
    if (!urlObj) {
      next();
      return false;
    }

    var hasIgnored = false;
    var hasOnly = false;

    if (this.staticExt.test(urlObj.pathname)) {
      next();
      return false;
    }

    if (this.onlyRE) {
      hasOnly = this.onlyRE.test(urlObj.pathname);
      hasIgnored = !hasOnly;
    }

    if (!hasOnly && this.only) {
      hasIgnored = true;

      for (var i = 0; i < this.only.length; i++) {
        if (Object.prototype.toString.call(this.only[i]) === strs.objs.string) {
          if (this.only[i] === urlObj.pathname) {
            hasIgnored = false;
            hasOnly = true;
            break;
          }
        } else if (Object.prototype.toString.call(this.only[i]) === strs.objs.regexp) {
          if (this.only[i].test(urlObj.pathname)) {
            hasIgnored = false;
            hasOnly = true;
            break;
          }
        } else {
          _warn('`opts.only` {' + this.only[i] + '} rule isn\'t instance of {String} nor {RegExp}, rule ignored!');
        }
      }
    }

    if (this.ignoreRE && this.ignoreRE.test(urlObj.pathname)) {
      hasIgnored = true;
    }

    if (hasIgnored) {
      next();
      return false;
    }

    var reqUrl = this.getServiceURL(urlObj, req.headers[strs.ua]);

    var reqHeaders = {
      'User-Agent': this.userAgent,
      Accept: '*/*',
    };

    if (this.auth) {
      reqHeaders.Authorization = strs.authBasic + Buffer.from(this.auth).toString(strs.enc.base64);
    }

    var payload = {
      method: method.toUpperCase(),
      headers: reqHeaders,
      agent: keepAliveAgent,
    };

    var requestOptionsKeys = Object.keys(this.requestOptions);

    if (requestOptionsKeys.length > 0) {
      for (var ii = 0; ii < requestOptionsKeys.length; ii++) {
        if (isObject(payload[requestOptionsKeys[ii]]) && isObject(this.requestOptions[requestOptionsKeys[ii]])) {
          payload[requestOptionsKeys[ii]] = Object.assign({}, payload[requestOptionsKeys[ii]], this.requestOptions[requestOptionsKeys[ii]]);
        } else {
          payload[requestOptionsKeys[ii]] = this.requestOptions[requestOptionsKeys[ii]];
        }
      }
    }

    try {
      var _headersRE = this.headersRE;
      var url = new URL(reqUrl);
      this.debug && _debug('[middleware] [requesting]', url.toString());
      var serviceReq = https.request(url, payload, function (resp) {
        for (var _hName in resp.headers) {
          if (resp.headers[_hName]) {
            var hName = _hName.toLowerCase();
            if (!res.headersSent && !_headersRE.test(hName)) {
              res.setHeader(hName, resp.headers[_hName]);
            }
          }
        }

        if (resp.statusCode === 401 || resp.statusCode === 403) {
          _warn('Can\'t authenticate! Please check "auth" parameter and other settings');
        }

        if (method === strs.head) {
          this.debug && _debug('[middleware] [request] [HEAD] [received and end]', resp.statusCode);
          res.writeHead(resp.statusCod);
          res.end();
          return;
        }

        if (!res.headersSent) {
          this.debug && _debug('[middleware] [request] [writeHead]', resp.statusCode);
          res.writeHead(resp.statusCode);
        }

        res.write(nullBuf);
        resp.on('data', function (data) {
          this.debug && _debug('[middleware] [response] [data received]', res.finished, res.writableEnded);
          if (!res.finished && !res.writableEnded) {
            res.write(data);
          }
        });

        resp.on('end', function (data) {
          this.debug && _debug('[middleware] [response] [end successfully]', res.finished, res.writableEnded);
          if (!res.finished && !res.writableEnded) {
            res.end(data);
          }
        });
      });

      var isEnded = false;
      var onEnd = function (error) {
        this.debug && _debug('[middleware] [onEnd]', error);
        if (isEnded) {
          return;
        }

        if (error) {
          // DO NOT THROW AN ERROR ABOUT ABORTED REQUESTS
          if (!req.writableEnded && !req.aborted && !req.destroyed && error?.statusCode !== 499) {
            _warn('Error while connecting to external service:', error);
            next();
            return;
          }
        }

        if (!res.headersSent) {
          res.writeHead(200);
        }
        if (!res.finished && !res.writableEnded) {
          res.end();
        }
        if (!serviceReq.writableEnded && !serviceReq.aborted && !serviceReq.destroyed) {
          serviceReq.end();
        }

        isEnded = true;
      };

      serviceReq.on('abort', onEnd);
      serviceReq.on('error', onEnd);
      serviceReq.on('timeout', onEnd);
      serviceReq.setNoDelay(true);
      serviceReq.setTimeout(this.timeout, onEnd);

      req.on('error', function (error) {
        _warn('[REQ] ["error" event] Unexpected error:', error);
        if (!req.aborted) {
          serviceReq.destroy();
          next();
        }
      });

      res.on('error', function (error) {
        _warn('[RES] ["error" event] Unexpected error:', error);
        serviceReq.destroy();
        next();
      });

      req.on('aborted', function () {
        this.debug && _debug('[middleware] [req.aborted]', arguments);
        // No need to log this event as nothing bad happened
        // this simply means host which sent this request
        // has aborted the connection or got disconnected
        req.aborted = true;
        serviceReq.destroy();
        try {
          res.end();
        } catch (e) {
          // We assume res.end() to throw an error
          // but still will call for it, as we'd like
          // to make sure memory, socket and session
          // are freed-up and closed
        }
      });

      // SET TIMEOUT AS A PRECAUTION
      res.setTimeout(this.timeout, onEnd);
      req.setTimeout(this.timeout, onEnd);
      serviceReq.setTimeout(this.timeout, onEnd);

      // SEND REQUEST TO PRERENDERING ENDPOINT
      serviceReq.end();
    } catch (e) {
      _warn('Exception while connecting to external service:', e);
      next();
      return false;
    }
    return true;
  };

  return Spiderable;
})();
