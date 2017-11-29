'use strict';
var express    = require('express');
var app        = express();
var Spiderable = require('spiderable-middleware');
var spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://render.ostr.io',
  auth: 'APIUser:APIPass'
});

app.use(spiderable.handler.bind(spiderable)).get('/', function (req, res) {
  res.send('Hello World');
});

app.listen(3000);
