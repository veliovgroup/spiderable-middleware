'use strict';
var http       = require('http');
var Spiderable = require('spiderable-middleware');
var spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://render.ostr.io',
  auth: 'APIUser:APIPass'
});

var requestListener = function(req, res) {
  spiderable.handler(req, res, function(){
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end('Hello vanilla NodeJS!');
  });
};

http.createServer(requestListener).listen(3000);
