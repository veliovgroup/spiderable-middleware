url     = require 'url'
request = require 'request'

module.exports = class Spiderable
  constructor: (opts) ->
    {@serviceURL, @auth, bots, ignore, @rootURL} = opts
    @handler ?= @middleware
    @handle  ?= @middleware
    defBots   = [
      'googlebot'
      'yahoo'
      'bingbot'
      'facebookexternalhit'
      'twitterbot'
      'rogerbot'
      'linkedinbot'
      'embedly'
      'quora link preview'
      'showyoubot'
      'outbrain'
      'pinterest'
      'developers.google.com/+/web/snippet'
      'slackbot'
      'vkShare'
      'W3C_Validator'
      'redditbot'
      'Applebot'
      'WhatsApp'
      'flipboard'
      'yandex'
      'google-structured-data-testing-tool'
      'MJ12Bot'
      'tweetmemeBot'
      'baiduSpider'
      'Mail\.RU_Bot'
      'ahrefsBot'
      'SiteLockSpider'
      'visionutils'
    ]
    defBots      = defBots.concat bots if bots
    @botsRE      = new RegExp defBots.join('|'), 'i'
    @auth       ?= ''
    ignore      ?= false
    @rootURL    ?= process.env.ROOT_URL
    @serviceURL ?= process.env.SPIDERABLE_SERVICE_URL || process.env.PRERENDER_SERVICE_URL || 'https://trace.ostr.io'

    unless @rootURL
      throw '[Spiderable-Middleware] {rootURL} or env variable ROOT_URL is not detected! But must be specified!'
    unless @serviceURL
      throw '[Spiderable-Middleware] {serviceURL} or env variable SPIDERABLE_SERVICE_URL or PRERENDER_SERVICE_URL is not detected! But must be specified!'

    unless /^http(s)?:\/\//i.test @rootURL
      throw '[Spiderable-Middleware] {rootURL} is malformed! Must start with protocol http or https'
    unless /^http(s)?:\/\//i.test @serviceURL
      throw '[Spiderable-Middleware] {serviceURL} is malformed! Must start with protocol http or https'

    @rootURL     = @rootURL.replace(/\/$/, '').replace /^\//, ''
    @serviceURL  = @serviceURL.replace(/\/$/, '').replace /^\//, ''

    request.defaults proxy: @serviceURL

    if ignore
      @ignoreRE = new RegExp ignore.join('|'), ''
    else
      @ignoreRE = false

  middleware: (req, res, next) =>
    urlObj     = url.parse req.url, true
    hasIgnored = false

    if req.method.toLowerCase() isnt 'get' and req.method.toLowerCase() isnt 'head'
      next()
      return false

    if @ignoreRE and @ignoreRE.test req.url
      hasIgnored = true

    if (urlObj.query.hasOwnProperty('_escaped_fragment_') or @botsRE.test(req.headers['user-agent'])) and not hasIgnored
      reqUrl       = @rootURL
      urlObj.path  = urlObj.path.replace(/\/$/, '').replace /^\//, ''

      if urlObj.query.hasOwnProperty('_escaped_fragment_') and urlObj.query._escaped_fragment_.length
        urlObj.path += '/' + urlObj.query._escaped_fragment_.replace /^\//, ''

      reqUrl += '/' + urlObj.pathname
      reqUrl  = reqUrl.replace /([^:]\/)\/+/g, "$1"
      phurl   = @serviceURL + '/?url=' + encodeURIComponent(reqUrl)
      opts    = url: phurl.replace /([^:]\/)\/+/g, "$1"
      if @auth and @auth.length and !!~@auth.indexOf ':'
        _as = @auth.split ':'
        opts.auth = 
          user: _as[0]
          pass: _as[1]

      request.get(opts).pipe res

    else
      next()