express    = require 'express'
app        = express()
Spiderable = require 'spiderable-middleware'
spiderable = new Spiderable
  rootURL: 'http://example.com'
  serviceURL: 'https://render.ostr.io'
  auth: 'APIUser:APIPass'

app.use(spiderable.handler).get '/', (req, res) ->
  res.send 'Hello World'

app.listen 3000