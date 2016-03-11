"use strict";
var connect    = require('connect');
var http       = require('http');
var app        = connect();
var Spiderable = require('spiderable-middleware');
var spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://trace.ostr.io',
  auth: 'APIUser:APIPass'
});

app.use(spiderable.handler).use(function (req, res) {
  res.end('Hello from Connect!\n');
});

http.createServer(app).listen(3000);