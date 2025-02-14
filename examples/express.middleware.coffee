express    = require 'express'
app        = express()
Spiderable = require 'spiderable-middleware'
spiderable = new Spiderable
  rootURL: 'http://example.com'
  serviceURL: 'https://render.ostr.io'
  auth: 'test:test'

app.use(spiderable.handle).get '/', (req, res) ->
  res.send 'Hello World'

app.listen 3000