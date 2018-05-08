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
  ignore: ['/user', '/billing', '/article/100', '/post/HhstejsJKH123jJi']
});

const re         = {
  trailingSlash: /\/$/,
  beginningSlash: /^\//,
};

const testURLs = {
  valid: ['', '/', '/articles', '/articles/', '/article/1', '/article/11', '/article/111/', '/posts', '/posts/', '/post/HhstejsJKH123jJ6', '/post/HhstejsJKH123jJ6/'],
  invalid: ['/asd', '/articles/rand234', '/posts/234/', '/article/100', '/article/100/', '/post/HhstejsJKH123jJi', '/post/HhstejsJKH123jJi/']
};

WebApp.connectHandlers.use(prerendering);

Meteor.startup(function(){
  if (Meteor.isServer) {
    Tinytest.add('Spiderable - Object', function (test) {
      test.isTrue(_.isObject(Spiderable), 'Spiderable is Object');
    });

    Tinytest.add('Spiderable - Instance', function (test) {
      test.isTrue(prerendering.rootURL === (process.env.ROOT_URL || '').replace(/\/$/, ''), 'Spiderable instance correctly initialized');
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
          test.isTrue(_.has(resp.headers, 'x-prerender-id'), 'Response has "x-prerender-id" header');
          test.isTrue(!!~resp.headers['x-prerender-id'].indexOf('TEST'), 'Value of "x-prerender-id" is correctly set');
          test.isTrue(!!~resp.content.indexOf('[PASSED]'), 'Response has correct body content');
          test.isTrue(!!~resp.content.indexOf(process.env.ROOT_URL), 'Response has correct ping-back URL');
        }
        next();
      });
    });

    Tinytest.addAsync('Prerendering & Middleware Setup - Static file', function (test, next) {
      HTTP.call('GET', process.env.ROOT_URL + '/packages/bootstrap/img/glyphicons-halflings.png', {
        headers: {
          'User-Agent': 'GoogleBot'
        }
      }, (error, resp) => {
        test.isTrue(!error);
        if (!error) {
          test.isTrue(resp.statusCode === 200, 'File received with correct statusCode');
          test.isFalse(_.has(resp.headers, 'x-prerender-id'), 'Has no "x-prerender-id" header');
          test.isTrue(resp.headers['content-type'] === 'image/png', 'Content type is properly set');
        }
        next();
      });
    });

    _.each(testURLs.valid, (testUrl, jj) => {
      const _testUrl = testUrl.replace(re.beginningSlash, '');
      Tinytest.addAsync('Test allowed (only) routes - ' + ' {' + jj + '} ' + _testUrl, function (test, next) {
        HTTP.call('GET', process.env.ROOT_URL + _testUrl, {
          headers: {
            'User-Agent': 'GoogleBot'
          }
        }, (error, resp) => {
          test.isTrue(!error);
          if (!error) {
            test.isTrue(resp.statusCode === 200, 'Page received with correct statusCode');
            test.isTrue(_.has(resp.headers, 'x-prerender-id'), 'Response has "x-prerender-id" header');
            test.isTrue(!!~resp.headers['x-prerender-id'].indexOf('TEST'), 'Value of "x-prerender-id" is correctly set');
            test.isTrue(!!~resp.content.indexOf('[PASSED]'), 'Response has correct body content');
            test.isTrue(!!~resp.content.indexOf(process.env.ROOT_URL + _testUrl), 'Response has correct ping-back URL');
          }
          next();
        });
      });
    });

    _.each(testURLs.invalid, (testUrl, jj) => {
      const _testUrl = testUrl.replace(re.beginningSlash, '');
      Tinytest.addAsync('Test ignored routes - ' + ' {' + jj + '} ' + _testUrl, function (test, next) {
        HTTP.call('GET', process.env.ROOT_URL + _testUrl, {
          headers: {
            'User-Agent': 'GoogleBot'
          }
        }, (error, resp) => {
          test.isTrue(!error);
          if (!error) {
            test.isTrue(resp.statusCode === 200, 'File received with correct statusCode');
            test.isFalse(_.has(resp.headers, 'x-prerender-id'), 'Has no "x-prerender-id" header');
            test.isTrue(!!~resp.content.indexOf('__meteor_runtime_config__'), 'Response has correct body content');
          }
          next();
        });
      });
    });
  }
});
