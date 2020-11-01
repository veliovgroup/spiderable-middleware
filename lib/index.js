var url = require('url');
var request = require('request-libcurl');

if (typeof window !== 'undefined') {
  throw new Error('Running `spiderable-middleware` in Browser environment isn\'t allowed! Please make sure `spiderable-middleware` NPM package is imported and used only in Node.js environment.');
}

var strs = {
  pipe: '|',
  empty: '',
  semicolon: ':',
  head: 'head',
  get: 'get',
  ua: 'user-agent',
  objs: {
    array: '[object Array]',
    regexp: '[object RegExp]',
    object: '[object Object]',
    string: '[object String]'
  }
};

var re = {
  newLine: /\r|\n/,
  proto: /^https?:\/\//i,
  trailingSlash: /\/$/,
  beginningSlash: /^\//,
  digit: /\d+/,
  staticExt: /\.(?:3ds|3g2|3gp|3gpp|7z|a|aac|aaf|adp|ai|aif|aiff|alz|ape|apk|appcache|ar|arj|asf|asx|atom|au|avchd|avi|bak|bbaw|bh|bin|bk|bmp|btif|bz2|bzip2|cab|caf|cco|cgm|class|cmx|cpio|cr2|crt|crx|css|csv|cur|dat|deb|der|dex|djvu|dll|dmg|dng|doc|docm|docx|dot|dotm|dra|drc|DS_Store|dsk|dts|dtshd|dvb|dwg|dxf|ear|ecelp4800|ecelp7470|ecelp9600|egg|eol|eot|eps|epub|exe|f4a|f4b|f4p|f4v|fbs|fh|fla|flac|fli|flv|fpx|fst|fvt|g3|geojson|gif|graffle|gz|gzip|h261|h263|h264|hqx|htc|ico|ief|img|ipa|iso|jad|jar|jardiff|jng|jnlp|jpeg|jpg|jpgv|jpm|js|jxr|key|kml|kmz|ktx|less|lha|lvp|lz|lzh|lzma|lzo|m2v|m3u|m4a|m4p|m4v|map|manifest|mar|markdown|md|mdi|mdown|mdwn|mht|mid|midi|mj2|mka|mkd|mkdn|mkdown|mkv|mml|mmr|mng|mobi|mov|movie|mp2|mp3|mp4|mp4a|mpe|mpeg|mpg|mpga|mpv|msi|msm|msp|mxf|mxu|nef|npx|nsv|numbers|o|oex|oga|ogg|ogv|opus|otf|pages|pbm|pcx|pdb|pdf|pea|pem|pgm|pic|pl|pm|png|pnm|pot|potm|potx|ppa|ppam|ppm|pps|ppsm|ppsx|ppt|pptm|pptx|prc|ps|psd|pya|pyc|pyo|pyv|qt|ra|rar|ras|raw|rdf|rgb|rip|rlc|rm|rmf|rmvb|ron|roq|rpm|rss|rtf|run|rz|s3m|s7z|safariextz|scpt|sea|sgi|shar|sil|sit|slk|smv|so|sub|svg|svgz|svi|swf|tar|tbz|tbz2|tcl|tga|tgz|thmx|tif|tiff|tk|tlz|topojson|torrent|ttc|ttf|txt|txz|udf|uvh|uvi|uvm|uvp|uvs|uvu|vcard|vcf|viv|vob|vtt|war|wav|wax|wbmp|wdp|weba|webapp|webm|webmanifest|webp|whl|wim|wm|wma|wml|wmlc|wmv|wmx|woff|woff2|wvx|xbm|xif|xla|xlam|xloc|xls|xlsb|xlsm|xlsx|xlt|xltm|xltx|xm|xmind|xml|xpi|xpm|xsl|xwd|xz|yuv|z|zip|zipx)(?:\?[a-zA-Z0-9\-\.\_\~\:\/\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]*)?$/i
};

var _debug = function debug (...args) {
  console.info.call(console, '[DEBUG] [Spiderable-Middleware]', ...args);
};

request.defaultOptions.debug       = false;
request.defaultOptions.headers     = { 'User-Agent': 'spiderable-middleware/1.6.1', Accept: '*/*' };
request.defaultOptions.noStorage   = true;
request.defaultOptions.rawBody     = true;
request.defaultOptions.retry       = true;
request.defaultOptions.retries     = 3;
request.defaultOptions.retryDelay  = 128;
request.defaultOptions.timeout     = 102400;
request.defaultOptions.wait        = true;
request.defaultOptions.badStatuses = [502, 503, 504, 599];
request.defaultOptions.isBadStatus = function (statusCode, badStatuses) {
  return badStatuses.includes(statusCode);
};

module.exports = (function () {
  function Spiderable(_opts) {
    var opts = {};
    if (_opts && Object.prototype.toString.call(_opts) === strs.objs.object) {
      opts = _opts;
    }

    this.auth       = opts.auth;
    var ignore      = opts.ignore || false;
    this.only       = opts.only || false;
    this.onlyRE     = opts.onlyRE || false;
    this.botsUA     = opts.botsUA || Spiderable.prototype.botsUA;
    this.rootURL    = opts.rootURL || process.env.ROOT_URL;
    this.timeout    = opts.timeout || 180000;
    this.staticExt  = opts.staticExt || re.staticExt;
    this.serviceURL = opts.serviceURL || process.env.SPIDERABLE_SERVICE_URL || process.env.PRERENDER_SERVICE_URL || 'https://render.ostr.io';
    this.ignoredHeaders = opts.ignoredHeaders || Spiderable.prototype.ignoredHeaders;
    this.requestOptions = opts.requestOptions || {};

    if (Object.prototype.toString.call(this.staticExt) !== strs.objs.regexp) {
      _debug('`opts.staticExt` must be instance of RegExp, falling back to defaults.');
      this.staticExt = re.staticExt;
    }

    if (this.onlyRE && Object.prototype.toString.call(this.onlyRE) !== strs.objs.regexp) {
      _debug('`opts.onlyRE` must be instance of RegExp, rules are ignored!');
      this.onlyRE = false;
    }

    if (Object.prototype.toString.call(this.botsUA) !== strs.objs.array) {
      _debug('`opts.botsUA` must be instance of Array, falling back to defaults.');
      this.botsUA = this.prototype.botsUA;
    }

    if (Object.prototype.toString.call(this.ignoredHeaders) !== strs.objs.array) {
      _debug('`opts.ignoredHeaders` must be instance of Array, falling back to defaults.');
      this.ignoredHeaders = this.prototype.ignoredHeaders;
    }

    if (this.only && Object.prototype.toString.call(this.only) !== strs.objs.array) {
      _debug('`opts.only` must be instance of Array, rules are ignored!');
      this.only = false;
    }

    if (!this.handler) {
      this.handler = this.middleware;
    }

    if (!this.handle) {
      this.handle = this.middleware;
    }

    this.headersRE = new RegExp(this.ignoredHeaders.join(strs.pipe), 'i');
    this.botsRE = new RegExp(this.botsUA.join(strs.pipe), 'i');
    if (!this.auth) {
      this.auth = process.env.SPIDERABLE_SERVICE_AUTH || process.env.PRERENDER_SERVICE_AUTH || strs.empty;
    }

    if (ignore && Object.prototype.toString.call(ignore) !== strs.objs.array) {
      _debug('`opts.ignore` must be instance of Array, rules are ignored!');
      ignore = false;
    }

    if (!this.rootURL) {
      throw new Error('{rootURL} or env variable ROOT_URL is not detected! But must be specified!');
    }

    if (!this.serviceURL) {
      throw new Error('{serviceURL} or env variable SPIDERABLE_SERVICE_URL or PRERENDER_SERVICE_URL is not detected! But must be specified!');
    }

    if (!re.proto.test(this.rootURL)) {
      throw new Error('{rootURL} is malformed! Must start with protocol http or https');
    }

    if (!re.proto.test(this.serviceURL)) {
      throw new Error('{serviceURL} is malformed! Must start with protocol http or https');
    }

    this.rootURL    = this.rootURL.replace(re.trailingSlash, strs.empty).replace(re.beginningSlash, strs.empty);
    this.serviceURL = this.serviceURL.replace(re.trailingSlash, strs.empty).replace(re.beginningSlash, strs.empty);

    if (ignore) {
      this.ignoreRE = new RegExp(ignore.join(strs.pipe), strs.empty);
    } else {
      this.ignoreRE = false;
    }
  }

  Spiderable.prototype.botsUA = ['\\.net crawler', '360spider', '50\\.nu', '8bo crawler bot', 'aboundex', 'accoona', 'adldxbot', 'adsbot-google', 'ahrefsbot', 'altavista', 'appengine-google', 'applebot', 'archiver', 'arielisbot', 'ask jeeves', 'auskunftbot', 'baidumobaider', 'baiduspider', 'becomebot', 'bingbot', 'bingpreview', 'bitbot', 'bitlybot', 'blitzbot', 'blogbridge', 'boardreader', 'botseer', 'catchbot', 'catchpoint bot', 'charlotte', 'checklinks', 'cliqzbot', 'clumboot', 'coccocbot', 'converacrawler', 'crawl-e', 'crawlconvera', 'dataparksearch', 'daum', 'deusu', 'developers\\.google\\.com/+/web/snippet', 'discordbot', 'dotbot', 'duckduckbot', 'elefent', 'embedly', 'evernote', 'exabot', 'facebookbot', 'facebookexternalhit', 'fatbot', 'fdse robot', 'feed seeker bot', 'feedfetcher', 'femtosearchbot', 'findlinks', 'flamingo_searchengine', 'flipboard', 'followsite bot', 'furlbot', 'fyberspider', 'gaisbot', 'galaxybot', 'geniebot', 'genieo', 'gigablast', 'gigabot', 'girafabot', 'gomezagent', 'gonzo1', 'google sketchup', 'google-structured-data-testing-tool', 'googlebot', 'haosouspider', 'heritrix', 'holmes', 'hoowwwer', 'htdig', 'ia_archiver', 'idbot', 'infuzapp', 'innovazion crawler', 'instagram', 'internetarchive', 'iqdb', 'iskanie', 'istellabot', 'izsearch\\.com', 'kaloogabot', 'kaz\\.kz_bot', 'kd bot', 'konqueror', 'kraken', 'kurzor', 'larbin', 'leia', 'lesnikbot', 'linguee bot', 'linkaider', 'linkapediabot', 'linkedinbot', 'lite bot', 'llaut', 'lookseek', 'lycos', 'mail\\.ru_bot', 'masidani_bot', 'masscan', 'mediapartners-google', 'metajobbot', 'mj12bot', 'mnogosearch', 'mogimogi', 'mojeekbot', 'motominerbot', 'mozdex', 'msiecrawler', 'msnbot', 'msrbot', 'netpursual', 'netresearch', 'netvibes', 'newsgator', 'ng-search', 'nicebot', 'nutchcvs', 'nuzzel', 'nymesis', 'objectssearch', 'odklbot', 'omgili', 'oovoo', 'oozbot', 'openfosbot', 'orangebot', 'orbiter', 'org_bot', 'outbrain', 'pagepeeker', 'pagesinventory', 'parsijoobot', 'paxleframework', 'peeplo screenshot bot', 'pinterest', 'plantynet_webrobot', 'plukkie', 'pompos', 'psbot', 'quora link preview', 'qwantify', 'read%20later', 'reaper', 'redcarpet', 'redditbot', 'retreiver', 'riddler', 'rival iq', 'rogerbot', 'saucenao', 'scooter', 'scrapy', 'scrubby', 'searchie', 'searchsight', 'seekbot', 'semanticdiscovery', 'seznambot', 'showyoubot', 'simplepie', 'simpy', 'sitelockspider', 'skypeuripreview', 'slack-imgproxy', 'slackbot', 'slurp', 'snappy', 'sogou', 'solofield', 'speedy spider', 'speedyspider', 'sputnikbot', 'stackrambler', 'teeraidbot', 'teoma', 'theusefulbot', 'thumbshots\\.ru', 'thumbshotsbot', 'tineye', 'toweya\\.com', 'toweyabot', 'tumblr', 'tweetedtimes', 'tweetmemebot', 'twitterbot', 'url2png', 'vagabondo', 'vebidoobot', 'viber', 'visionutils', 'vkshare', 'voilabot', 'vortex', 'votay bot', 'voyager', 'w3c_validator', 'wasalive\\.bot', 'web-sniffer', 'websquash\\.com', 'webthumb', 'whatsapp', 'whatweb', 'wire', 'wotbox', 'yacybot', 'yahoo', 'yandex', 'yeti', 'yisouspider', 'yodaobot', 'yooglifetchagent', 'yoozbot', 'yottaamonitor', 'yowedo', 'zao-crawler', 'zebot_www\\.ze\\.bz', 'zooshot', 'zyborg'];

  Spiderable.prototype.ignoredHeaders = ['age', 'alt-svc', 'cache-status', 'cf-connecting-ip', 'cf-ipcountry', 'cf-cache-status', 'cf-ray', 'cf-request-id', 'cnection', 'cneonction', 'connection', 'content-encoding', 'content-length', 'date', 'etag', 'expect-ct', 'expires', 'keep-alive', 'last-modified', 'link', 'nel', 'nncoection', 'pragma', 'server', 'set-cookie', 'status', 'transfer-encoding', 'report-to', 'vary', 'via', 'www-authenticate', 'x-accel-buffering', 'x-accel-charset', 'x-accel-expires', 'x-accel-limit-rate', 'x-accel-redirect', 'x-ostrio-domain', 'x-powered-by', 'x-preprender-status', 'x-prerender-status', 'x-real-ip', 'x-runtime'];

  Spiderable.prototype.middleware = function (req, res, next) {
    var method = req.method.toLowerCase();
    if (method !== strs.get && method !== strs.head) {
      return next();
    }

    var urlObj = url.parse(req.url, true);
    if ((urlObj.query && urlObj.query._escaped_fragment_ !== void 0) || this.botsRE.test(req.headers[strs.ua] || strs.empty)) {
      var hasIgnored = false;
      var hasOnly    = false;

      if (this.staticExt.test(urlObj.pathname)) {
        return next();
      }

      if (this.onlyRE) {
        hasOnly    = this.onlyRE.test(urlObj.pathname);
        hasIgnored = !hasOnly;
      }

      if (!hasOnly && this.only) {
        hasIgnored = true;

        for (var i = 0; i < this.only.length; i++) {
          if (Object.prototype.toString.call(this.only[i]) === strs.objs.string) {
            if (this.only[i] === urlObj.pathname) {
              hasIgnored = false;
              hasOnly    = true;
              break;
            }
          } else if (Object.prototype.toString.call(this.only[i]) === strs.objs.regexp) {
            if (this.only[i].test(urlObj.pathname)) {
              hasIgnored = false;
              hasOnly    = true;
              break;
            }
          } else {
            _debug('`opts.only` {' + this.only[i] + '} rule isn\'t instance of {String} nor {RegExp}, rule ignored!');
          }
        }
      }

      if (this.ignoreRE && this.ignoreRE.test(urlObj.pathname)) {
        hasIgnored = true;
      }

      if (hasIgnored) {
        return next();
      }

      var reqUrl = this.rootURL;

      urlObj.path = urlObj.path.replace(re.trailingSlash, strs.empty).replace(re.beginningSlash, strs.empty);
      if (urlObj.query && typeof urlObj.query._escaped_fragment_ === 'string' && urlObj.query._escaped_fragment_.length) {
        urlObj.pathname += '/' + urlObj.query._escaped_fragment_.replace(re.beginningSlash, strs.empty);
      }

      reqUrl += '/' + urlObj.pathname;
      reqUrl  = reqUrl.replace(/([^:]\/)\/+/g, '$1');
      reqUrl  = (this.serviceURL + '/?url=' + encodeURIComponent(reqUrl));

      if (req.headers[strs.ua]) {
        reqUrl += '&bot=' + encodeURIComponent(req.headers[strs.ua]);
      }

      var opts  = Object.assign({}, this.requestOptions, {
        uri: reqUrl,
        auth: this.auth || false
      });

      try {
        var usedHeaders = [];
        var _headersRE  = this.headersRE;
        var serviceReq  = request(opts, function (error, resp) {
          if (error) {
            // DO NOT THROW AN ERROR ABOUT ABORTED REQUESTS
            if (!req.aborted) {
              _debug('Error while connecting to external service:', error);
              next();
            }
          } else {
            if (resp.statusCode === 401 || resp.statusCode === 403) {
              _debug('Can\'t authenticate! Please check you "auth" parameter and other settings.');
            }

            if (method === strs.head) {
              res.end();
            }
          }
        });

        serviceReq.onHeader(function (header) {
          var h = header.toString('utf8');
          if (h.includes(strs.semicolon)) {
            h = h.split(strs.semicolon);
            h[0] = h[0].trim().toLowerCase();
            h[1] = h[1].replace(re.newLine, strs.empty).trim();

            if (!res.headersSent && h[1].length && !usedHeaders.includes(h[0])) {
              if (h[0] === 'status') {
                var status = h[1].match(re.digit);
                if (status && status[0]) {
                  res.statusCode = status[0];
                  usedHeaders.push(h[0]);
                }
              } else if (!_headersRE.test(h[0])) {
                try {
                  res.setHeader(h[0], h[1]);
                } catch (e) {
                  _debug('.setHeader() Error:', e);
                }
                usedHeaders.push(h[0]);
              }
            }
          }
        });

        if (method !== strs.head) {
          serviceReq.pipe(res);
        }

        req.on('error', function (error) {
          _debug('[REQ] ["error" event] Unexpected error:', error);
          serviceReq.abort();
          next();
        });

        res.on('error', function (error) {
          _debug('[RES] ["error" event] Unexpected error:', error);
          serviceReq.abort();
          next();
        });

        req.on('aborted', function () {
          // No need to log this event as nothing bad happened
          // this simply means host which sent this request
          // has aborted the connection or got disconnected
          // _debug('[REQ] ["aborted" event]:', arguments); // TODO: comment out
          req.aborted = true;
          serviceReq.abort();
          try {
            res.end();
          } catch (e) {
            // We assume res.end() to throw an error
            // but still will call for it, as we'd like
            // to make sure memory, socket and session
            // are freed-up and closed
          }
        });

        // SET TIMEOUT AS A SECURITY PRECAUTION
        res.setTimeout(this.timeout);

        // res.on('close', function () {
        //   _debug('[RES] ["close" event]:', arguments);
        //   serviceReq.abort();
        //   next();
        // });

        serviceReq.send();
      } catch (e) {
        _debug('Exception while connecting to external service:', e);
        next();
      }
      return true;
    }
    return next();
  };

  return Spiderable;
})();
