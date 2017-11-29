const _          = require('underscore');
const http       = require('http');
const urlUtil    = require('url');
const request    = require('request');
const Spiderable = require('spiderable-middleware');
const prerendering = new Spiderable({
  rootURL: process.env.ROOT_URL,
  auth: 'test:test'
});

const url              = urlUtil.parse(process.env.ROOT_URL);
const { assert }       = require('chai');
const { it, describe } = require('mocha');

const requestListener = function (req, res) {
  prerendering.handler(req, res, () => {
    res.writeHead(200, {'Content-Type': 'text/plain; charset=UTF-8'});
    res.end('Hello vanilla NodeJS!');
  });
};

http.createServer(requestListener).listen(parseInt(url.port || 3003));

describe('Has Spiderable Object', () => {
  it('Spiderable is Constructor', () => {
    assert.isFunction(Spiderable, 'Spiderable is Constructor');
  });
});

describe('Has Spiderable Instance', () => {
  it('prerendering is instance of Spiderable', () => {
    assert.instanceOf(prerendering, Spiderable, 'prerendering is instance of Spiderable');
  });

  it('instance is created properly', () => {
    assert.isTrue(prerendering.rootURL === (process.env.ROOT_URL || '').replace(/\/$/, ''), 'rootURL is set and has right value');
  });
});

describe('Has botsRE property', () => {
  it('botsRE is RegExp', () => {
    assert.typeOf(prerendering.botsRE, 'regexp', 'botsRE is RegExp');
  });
});

describe('Check Prerendering & Middleware Setup', function () {
  this.slow(3000);
  this.timeout(5000);

  it('Send request and catch response', function (done) {
    request({
      url: process.env.ROOT_URL,
      method: 'GET',
      headers: {
        'User-Agent': 'GoogleBot'
      }
    }, (error, resp, body) => {
      assert.isTrue(!error, 'no error');
      if (!error) {
        assert.isTrue(resp.statusCode === 200, 'status code is 200');
        assert.isTrue(_.has(resp.headers, 'x-prerender-id'), 'has "x-prerender-id" header');
        assert.isTrue(!!~resp.headers['x-prerender-id'].indexOf('TEST'), '"x-prerender-id" is TEST');
        assert.isTrue(!!~body.indexOf('[PASSED]'), 'Test response has "[PASSED]" keyword');
        assert.isTrue(!!~body.indexOf(process.env.ROOT_URL), 'Test response has valid source URL keyword');
      }
      done();
    });
  });
});
