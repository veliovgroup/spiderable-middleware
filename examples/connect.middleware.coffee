connect    = require 'connect'
http       = require 'http'
app        = connect()
Spiderable = require 'spiderable-middleware'
spiderable = new Spiderable
  rootURL: 'http://example.com'
  serviceURL: 'https://render.ostr.io'
  auth: 'test:test'

app.use(spiderable.handle).use (req, res) ->
  res.end 'Hello from Connect!\n'

http.createServer(app).listen 3000