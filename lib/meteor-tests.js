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
      test.isTrue(_.isObject(Spiderable));
    });

    Tinytest.add('Has Spiderable Instance', function (test) {
      test.isTrue(prerendering.rootURL === (process.env.ROOT_URL || '').replace(/\/$/, ''));
    });

    Tinytest.addAsync('Check Prerendering & Middleware Setup', function (test, next) {
      HTTP.call('GET', process.env.ROOT_URL, {
        headers: {
          'User-Agent': 'GoogleBot'
        }
      }, (error, resp) => {
        test.isTrue(!error);
        if (!error) {
          test.isTrue(resp.statusCode === 200);
          test.isTrue(_.has(resp.headers, 'x-prerender-id'));
          test.isTrue(!!~resp.headers['x-prerender-id'].indexOf('TEST'));
          test.isTrue(!!~resp.content.indexOf('[PASSED]'));
          test.isTrue(!!~resp.content.indexOf(process.env.ROOT_URL));
        }
        next();
      });
    });
  }
});
