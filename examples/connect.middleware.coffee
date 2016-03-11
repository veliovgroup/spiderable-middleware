connect    = require 'connect'
http       = require 'http'
app        = connect()
Spiderable = require 'spiderable-middleware'
spiderable = new Spiderable
  rootURL: 'http://example.com'
  serviceURL: 'https://trace.ostr.io'
  auth: 'APIUser:APIPass'

app.use(spiderable.handler).use (req, res) ->
  res.end 'Hello from Connect!\n'

http.createServer(app).listen 3000