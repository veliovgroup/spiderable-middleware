import { _ }      from 'meteor/underscore';
import { HTTP }   from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Spiderable from 'meteor/ostrio:spiderable-middleware';

const prerendering = new Spiderable({
  rootURL: process.env.ROOT_URL,
  auth: 'test:test'
});

WebApp.connectHandlers.use(prerendering);

Meteor.startup(function(){
  if (Meteor.isServer) {
    Tinytest.add('Has Spiderable Object', function (test) {
      test.isTrue(_.isObject(Spiderable), 'Spiderable is Object');
    });

    Tinytest.add('Has Spiderable Instance', function (test) {
      test.isTrue(prerendering.rootURL === (process.env.ROOT_URL || '').replace(/\/$/, ''), 'Spiderable instance correctly initialized');
    });

    Tinytest.add('Has botsRE property', function (test) {
      test.isTrue(_.isRegExp(prerendering.botsRE), 'Spiderable instance correctly initialized, and has "botsRE" property');
    });

    Tinytest.addAsync('Check Prerendering & Middleware Setup', function (test, next) {
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

    Tinytest.addAsync('Check Prerendering & Middleware Setup [static file]', function (test, next) {
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
  }
});
