http       = require 'http'
Spiderable = require 'spiderable-middleware'
spiderable = new Spiderable
  rootURL: 'http://example.com'
  serviceURL: 'https://render.ostr.io'
  auth: 'test:test'

requestListener = (req, res) ->
  spiderable.handle req, res, ->
    res.writeHead 200, 'Content-Type': 'text/plain; charset=UTF-8'
    res.end 'Hello vanilla NodeJS!'

http.createServer(requestListener).listen 3000