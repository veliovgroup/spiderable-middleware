var url       = require('url');
var request   = require('request');
var re        = {
  proto: /^https?:\/\//i,
  trailingSlash: /\/$/,
  beginningSlash: /^\//,
  staticExt: /\.(?:3ds|3g2|3gp|3gpp|7z|a|aac|aaf|adp|ai|aif|aiff|alz|ape|apk|appcache|ar|arj|asf|asx|atom|au|avchd|avi|bak|bbaw|bh|bin|bk|bmp|btif|bz2|bzip2|cab|caf|cco|cgm|class|cmx|cpio|cr2|crt|crx|css|csv|cur|dat|deb|der|dex|djvu|dll|dmg|dng|doc|docm|docx|dot|dotm|dra|drc|DS_Store|dsk|dts|dtshd|dvb|dwg|dxf|ear|ecelp4800|ecelp7470|ecelp9600|egg|eol|eot|eps|epub|exe|f4a|f4b|f4p|f4v|fbs|fh|fla|flac|fli|flv|fpx|fst|fvt|g3|geojson|gif|graffle|gz|gzip|h261|h263|h264|hqx|htc|ico|ief|img|ipa|iso|jad|jar|jardiff|jng|jnlp|jpeg|jpg|jpgv|jpm|js|jxr|key|kml|kmz|ktx|less|lha|lvp|lz|lzh|lzma|lzo|m2v|m3u|m4a|m4p|m4v|map|manifest|mar|markdown|md|mdi|mdown|mdwn|mht|mid|midi|mj2|mka|mkd|mkdn|mkdown|mkv|mml|mmr|mng|mobi|mov|movie|mp2|mp3|mp4|mp4a|mpe|mpeg|mpg|mpga|mpv|msi|msm|msp|mxf|mxu|nef|npx|nsv|numbers|o|oex|oga|ogg|ogv|opus|otf|pages|pbm|pcx|pdb|pdf|pea|pem|pgm|pic|pl|pm|png|pnm|pot|potm|potx|ppa|ppam|ppm|pps|ppsm|ppsx|ppt|pptm|pptx|prc|ps|psd|pya|pyc|pyo|pyv|qt|ra|rar|ras|raw|rdf|rgb|rip|rlc|rm|rmf|rmvb|ron|roq|rpm|rss|rtf|run|rz|s3m|s7z|safariextz|scpt|sea|sgi|shar|sil|sit|slk|smv|so|sub|svg|svgz|svi|swf|tar|tbz|tbz2|tcl|tga|tgz|thmx|tif|tiff|tk|tlz|topojson|torrent|ttc|ttf|txt|txz|udf|uvh|uvi|uvm|uvp|uvs|uvu|vcard|vcf|viv|vob|vtt|war|wav|wax|wbmp|wdp|weba|webapp|webm|webmanifest|webp|whl|wim|wm|wma|wml|wmlc|wmv|wmx|woff|woff2|wvx|xbm|xif|xla|xlam|xloc|xls|xlsb|xlsm|xlsx|xlt|xltm|xltx|xm|xmind|xml|xpi|xpm|xsl|xwd|xz|yuv|z|zip|zipx)(?:\?[a-zA-Z0-9\-\.\_\~\:\/\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]*)?$/i
};
var _debug    = function () {
  console.trace();
  console.warn.apply(null, arguments);
};

module.exports = (function () {
  function Spiderable(_opts) {
    var opts = {};
    if (_opts && Object.prototype.toString.call(_opts) === '[object Object]') {
      opts = _opts;
    }

    this.auth       = opts.auth;
    var ignore      = opts.ignore;
    this.botsUA     = opts.botsUA || Spiderable.prototype.botsUA;
    this.rootURL    = opts.rootURL;
    this.staticExt  = opts.staticExt || re.staticExt;
    this.serviceURL = opts.serviceURL;

    if (Object.prototype.toString.call(this.staticExt) !== '[object RegExp]') {
      _debug('[Spiderable-Middleware] `opts.staticExt` must be instance of RegExp, falling back to defaults.');
      this.staticExt = re.staticExt;
    }

    if (Object.prototype.toString.call(this.botsUA) !== '[object Array]') {
      _debug('[Spiderable-Middleware] `opts.botsUA` must be instance of Array, falling back to defaults.');
      this.botsUA = this.prototype.botsUA;
    }

    if (!this.handler) {
      this.handler = this.middleware;
    }

    if (!this.handle) {
      this.handle = this.middleware;
    }

    this.botsRE = new RegExp(this.botsUA.join('|'), 'i');
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

    if (!re.proto.test(this.rootURL)) {
      throw new Error('[Spiderable-Middleware] {rootURL} is malformed! Must start with protocol http or https');
    }

    if (!re.proto.test(this.serviceURL)) {
      throw new Error('[Spiderable-Middleware] {serviceURL} is malformed! Must start with protocol http or https');
    }

    this.rootURL    = this.rootURL.replace(re.trailingSlash, '').replace(re.beginningSlash, '');
    this.serviceURL = this.serviceURL.replace(re.trailingSlash, '').replace(re.beginningSlash, '');

    request.defaults({
      proxy: this.serviceURL
    });

    if (ignore) {
      this.ignoreRE = new RegExp(ignore.join('|'), '');
    } else {
      this.ignoreRE = false;
    }
  }

  Spiderable.prototype.botsUA = ['\\.net crawler', '360spider', '50\\.nu', '8bo crawler bot', 'aboundex', 'accoona', 'adldxbot', 'adsbot-google', 'ahrefsbot', 'altavista', 'appengine-google', 'applebot', 'archiver', 'arielisbot', 'ask jeeves', 'auskunftbot', 'baidumobaider', 'baiduspider', 'becomebot', 'bingbot', 'bingpreview', 'bitbot', 'bitlybot', 'blitzbot', 'blogbridge', 'boardreader', 'botseer', 'catchbot', 'catchpoint bot', 'charlotte', 'checklinks', 'cliqzbot', 'clumboot', 'coccocbot', 'converacrawler', 'crawl-e', 'crawlconvera', 'dataparksearch', 'daum', 'deusu', 'developers\\.google\\.com/+/web/snippet', 'discordbot', 'dotbot', 'duckduckbot', 'elefent', 'embedly', 'evernote', 'exabot', 'facebookbot', 'facebookexternalhit', 'fatbot', 'fdse robot', 'feed seeker bot', 'feedfetcher', 'femtosearchbot', 'findlinks', 'flamingo_searchengine', 'flipboard', 'followsite bot', 'furlbot', 'fyberspider', 'gaisbot', 'galaxybot', 'geniebot', 'genieo', 'gigablast', 'gigabot', 'girafabot', 'gomezagent', 'gonzo1', 'google sketchup', 'google-structured-data-testing-tool', 'googlebot', 'haosouspider', 'heritrix', 'holmes', 'hoowwwer', 'htdig', 'ia_archiver', 'idbot', 'infuzapp', 'innovazion crawler', 'instagram', 'internetarchive', 'iqdb', 'iskanie', 'istellabot', 'izsearch\\.com', 'kaloogabot', 'kaz\\.kz_bot', 'kd bot', 'konqueror', 'kraken', 'kurzor', 'larbin', 'leia', 'lesnikbot', 'linguee bot', 'linkaider', 'linkapediabot', 'linkedinbot', 'lite bot', 'llaut', 'lookseek', 'lycos', 'mail\\.ru_bot', 'masidani_bot', 'masscan', 'mediapartners-google', 'metajobbot', 'mj12bot', 'mnogosearch', 'mogimogi', 'mojeekbot', 'motominerbot', 'mozdex', 'msiecrawler', 'msnbot', 'msrbot', 'netpursual', 'netresearch', 'netvibes', 'newsgator', 'ng-search', 'nicebot', 'nutchcvs', 'nuzzel', 'nymesis', 'objectssearch', 'odklbot', 'omgili', 'oovoo', 'oozbot', 'openfosbot', 'orangebot', 'orbiter', 'org_bot', 'outbrain', 'pagepeeker', 'pagesinventory', 'parsijoobot', 'paxleframework', 'peeplo screenshot bot', 'pinterest', 'plantynet_webrobot', 'plukkie', 'pompos', 'psbot', 'quora link preview', 'qwantify', 'read%20later', 'reaper', 'redcarpet', 'redditbot', 'retreiver', 'riddler', 'rival iq', 'rogerbot', 'saucenao', 'scooter', 'scrapy', 'scrubby', 'searchie', 'searchsight', 'seekbot', 'semanticdiscovery', 'seznambot', 'showyoubot', 'simplepie', 'simpy', 'sitelockspider', 'skypeuripreview', 'slack-imgproxy', 'slackbot', 'slurp', 'snappy', 'sogou', 'solofield', 'speedy spider', 'speedyspider', 'sputnikbot', 'stackrambler', 'teeraidbot', 'teoma', 'theusefulbot', 'thumbshots\\.ru', 'thumbshotsbot', 'tineye', 'toweya\\.com', 'toweyabot', 'tumblr', 'tweetedtimes', 'tweetmemebot', 'twitterbot', 'url2png', 'vagabondo', 'vebidoobot', 'viber', 'visionutils', 'vkshare', 'voilabot', 'vortex', 'votay bot', 'voyager', 'w3c_validator', 'wasalive\\.bot', 'web-sniffer', 'websquash\\.com', 'webthumb', 'whatsapp', 'whatweb', 'wire', 'wotbox', 'yacybot', 'yahoo', 'yandex', 'yeti', 'yisouspider', 'yodaobot', 'yooglifetchagent', 'yoozbot', 'yottaamonitor', 'yowedo', 'zao-crawler', 'zebot_www\\.ze\\.bz', 'zooshot', 'zyborg'];

  Spiderable.prototype.middleware = function (req, res, next) {
    var urlObj     = url.parse(req.url, true);
    var hasIgnored = false;

    if (req.method.toLowerCase() !== 'get' && req.method.toLowerCase() !== 'head') {
      return next();
    }

    if (this.ignoreRE && this.ignoreRE.test(req.url)) {
      hasIgnored = true;
    }

    if ((urlObj.query._escaped_fragment_ !== void 0 || this.botsRE.test(req.headers['user-agent'] || '')) && !hasIgnored) {
      if (this.staticExt.test(req.url)) {
        return next();
      }

      var reqUrl = this.rootURL;

      urlObj.path = urlObj.path.replace(re.trailingSlash, '').replace(re.beginningSlash, '');
      if (urlObj.query._escaped_fragment_ !== void 0 && urlObj.query._escaped_fragment_.length) {
        urlObj.pathname += '/' + urlObj.query._escaped_fragment_.replace(re.beginningSlash, '');
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
        req.on('error', function (error) {
          _debug('[Spiderable-Middleware] [REQ] Unexpected error:', error);
          next();
        });

        res.on('error', function (error) {
          _debug('[Spiderable-Middleware] [RES] Unexpected error:', error);
          next();
        });

        request.get(opts, function (error) {
          if (error) {
            _debug('[Spiderable-Middleware] [request.get] Error while connecting to external service:', error);
            next();
          }
        }).on('response', function (response) {
          if (response.statusCode === 401 || response.statusCode === 403) {
            _debug('[Spiderable-Middleware] Can\'t authenticate! Please check you "auth" parameter and other settings.');
          }

        }).pipe(res).on('error', function (error) {
          _debug('[Spiderable-Middleware] Unexpected error:', error);
          next();
        });
      } catch (e) {
        _debug('[Spiderable-Middleware] Exception while connecting to external service:', e);
        next();
      }
      return true;
    }
    return next();
  };

  return Spiderable;
})();
