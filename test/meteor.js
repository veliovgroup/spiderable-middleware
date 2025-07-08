import { _ }      from 'meteor/underscore';
import { HTTP }   from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Spiderable from 'meteor/ostrio:spiderable-middleware';

const prerendering = new Spiderable({
  rootURL: process.env.ROOT_URL,
  auth: 'test:test',
  only: [
    '/',
    /^\/articles\/?$/,
    /^\/article\/[0-9]{1,3}\/?$/
  ],
  onlyRE: /^(\/|\/posts|\/post\/[A-z0-9]{16})\/?$/,
  ignore: ['/user', '/billing', '/article/100', '/post/HhstejsJKH123jJi'],
  serviceURL: 'https://render-bypass.ostr.io',
  requestOptions: {
    debug: process.env.DEBUG === 'true',
    keepAlive: true
  }
});

const re = {
  trailingSlash: /\/$/,
  beginningSlash: /^\//,
};

const testURLs = {
  valid: [
    '',
    '/',
    '/articles',
    '/articles/',
    '/article/1',
    '/article/11',
    '/article/111/',
    '/article/111/?show=sidebar&type=meteor.js',
    '/posts',
    '/posts/',
    '/posts/?listing=true&page=2&categories=auto:color:size-M&type=meteor.js',
    '/post/HhstejsJKH123jJ6',
    '/post/HhstejsJKH123jJ6/',
    '/post/HhstejsJKH123jJ6/?page=1234&category=test-category&type=meteor.js',
  ],
  invalid: [
    '/user',
    '/billing',
    '/asd',
    '/articles/rand234',
    '/posts/234/',
    '/article/100',
    '/article/100/',
    '/article/100/?tab=first&type=meteor.js',
    '/post/HhstejsJKH123jJi',
    '/post/HhstejsJKH123jJi?color=red&type=meteor.js',
    '/post/HhstejsJKH123jJi/',
  ]
};

if (Meteor.release.includes('@1') || Meteor.release.includes('@2')) {
  WebApp.connectHandlers.use(prerendering);
} else {
  WebApp.connectHandlers.use(prerendering.handler);
}

Meteor.startup(function(){
  if (Meteor.isServer) {
    Tinytest.add('Spiderable - Object', function (test) {
      test.isTrue(_.isObject(Spiderable), 'Spiderable is Object');
    });

    Tinytest.add('Spiderable - Instance', function (test) {
      test.isTrue(prerendering.rootURL === (process.env.ROOT_URL || '').replace(re.trailingSlash, ''), 'Spiderable instance correctly initialized');
    });

    Tinytest.add('Spiderable - botsRE property', function (test) {
      test.isTrue(_.isRegExp(prerendering.botsRE), 'Spiderable instance correctly initialized, and has "botsRE" property');
    });

    Tinytest.addAsync('Prerendering & Middleware Setup - App', function (test, next) {
      HTTP.call('GET', process.env.ROOT_URL, {
        headers: {
          'User-Agent': 'GoogleBot'
        }
      }, (error, resp) => {
        test.isTrue(!error);
        if (!error) {
          test.isTrue(resp.statusCode === 200, 'Page received with correct statusCode');
          test.isTrue(resp.headers && !!resp.headers['x-prerender-id'], 'Response has "x-prerender-id" header');
          test.isTrue(resp.headers['x-prerender-id'] && resp.headers['x-prerender-id'].includes('TEST'), 'Value of "x-prerender-id" is correctly set');
          test.isTrue(resp.content.includes('[PASSED]'), 'Response has correct body content');
          test.isTrue(resp.content.includes(process.env.ROOT_URL), 'Response has correct ping-back URL');
        }
        next();
      });
    });

    Tinytest.addAsync('Prerendering & Middleware Setup - Static file', function (test, next) {
      HTTP.call('GET', (process.env.ROOT_URL || '').replace(re.trailingSlash, '') + '/packages/test-in-browser/driver.css', {
        headers: {
          'User-Agent': 'GoogleBot'
        }
      }, (error, resp) => {
        test.isTrue(!error);
        if (!error) {
          test.isTrue(resp.statusCode === 200, 'File received with correct statusCode');
          test.isFalse(resp.headers && !!resp.headers['x-prerender-id'], 'Has no "x-prerender-id" header');
          test.isTrue(resp.headers['content-type'].includes('text/css'), 'Has correct content type header');
        }
        next();
      });
    });

    _.each(testURLs.valid, (testUrl, jj) => {
      const testRoot = (process.env.ROOT_URL || '').replace(re.trailingSlash, '');
      Tinytest.addAsync(`Test allowed (only) routes - { ${jj} } ${testUrl}`, function (test, next) {
        HTTP.call('GET', testRoot + testUrl, {
          headers: {
            'User-Agent': 'GoogleBot'
          }
        }, (error, resp) => {
          test.isTrue(!error);
          if (!error) {
            test.isTrue(resp.statusCode === 200, 'Page received with correct statusCode');
            test.isTrue(resp.headers && !!resp.headers['x-prerender-id'], 'Response has "x-prerender-id" header');
            test.isTrue(resp.headers['x-prerender-id'] && resp.headers['x-prerender-id'].includes('TEST'), 'Value of "x-prerender-id" is correctly set');
            test.isTrue(resp.content.includes('[PASSED]'), 'Response has correct body content');
            test.isTrue(resp.content.includes(testRoot + testUrl), 'Response has correct ping-back URL');
          }
          next();
        });
      });
    });

    _.each(testURLs.invalid, (testUrl, jj) => {
      const testRoot = (process.env.ROOT_URL || '').replace(re.trailingSlash, '');
      Tinytest.addAsync(`Test ignored routes - { ${jj} } ${testUrl}`, function (test, next) {
        HTTP.call('GET', testRoot + testUrl, {
          headers: {
            'User-Agent': 'GoogleBot'
          }
        }, (error, resp) => {
          test.isTrue(!error);
          if (!error) {
            test.isTrue(resp.statusCode === 200, 'File received with correct statusCode');
            test.isFalse(resp.headers && !!resp.headers['x-prerender-id'], 'Has no "x-prerender-id" header');
            test.isTrue(resp.content.includes('__meteor_runtime_config__'), 'Response has correct body content');
          }
          next();
        });
      });
    });
  }
});
