import { _ } from 'meteor/underscore';
import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import Spiderable from 'meteor/ostrio:spiderable-middleware';
import { Tinytest } from 'meteor/tinytest';

import type { SpiderableOptions } from 'meteor/ostrio:spiderable-middleware';

if (!process.env.ROOT_URL) {
  throw new Error('ROOT_URL env.var is not defined! Please run test with ROOT_URL, like `ROOT_URL=http://localhost:3000 meteor test-packages ./`');
}

const re: Record<string, RegExp> = {
  trailingSlash: /\/$/,
  beginningSlash: /^\//
};

const rootURL: string = (process.env.ROOT_URL || '').replace(re.trailingSlash, '');

const opts: SpiderableOptions = {
  rootURL,
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
    headers: {
      'x-http-custom': 'value'
    }
  }
};
const prerendering: Spiderable = new Spiderable(opts);

const testURLs: { valid: string[]; invalid: string[] } = {
  valid: [
    '',
    '/',
    '/articles',
    '/articles/',
    '/article/1',
    '/article/11',
    '/article/111/',
    '/article/111/?show=sidebar&type=meteor.ts',
    '/posts',
    '/posts/',
    '/posts/?listing=true&page=2&categories=auto:color:size-M&type=meteor.ts',
    '/post/HhstejsJKH123jJ6',
    '/post/HhstejsJKH123jJ6/',
    '/post/HhstejsJKH123jJ6/?page=1234&category=test-category&type=meteor.ts',
  ],
  invalid: [
    '/user',
    '/billing',
    '/asd',
    '/articles/rand234',
    '/posts/234/',
    '/article/100',
    '/article/100/',
    '/article/100/?tab=first&type=meteor.ts',
    '/post/HhstejsJKH123jJi',
    '/post/HhstejsJKH123jJi?color=red&type=meteor.ts',
    '/post/HhstejsJKH123jJi/',
  ]
};

if (Meteor.release.includes('@1') || Meteor.release.includes('@2')) {
  WebApp.connectHandlers.use(prerendering);
} else {
  WebApp.connectHandlers.use(prerendering.handler);
}

const callOpts: HTTP.HTTPRequest = {
  headers: {
    'User-Agent': 'GoogleBot'
  }
};

Meteor.startup(() => {
  if (Meteor.isServer) {
    Tinytest.add('[TS] Spiderable - Object', function (test: Tinytest.Test) {
      test.isTrue(_.isObject(Spiderable), 'Spiderable is Object');
    });

    Tinytest.add('[TS] Spiderable - Instance', function (test: Tinytest.Test) {
      test.isTrue(prerendering.rootURL === rootURL, 'Spiderable instance correctly initialized');
    });

    Tinytest.add('[TS] Spiderable - botsRE property', function (test: Tinytest.Test) {
      test.isTrue(_.isRegExp(prerendering.botsRE), 'Spiderable instance correctly initialized, and has "botsRE" property');
    });

    Tinytest.addAsync('[TS] Prerendering & Middleware Setup - App', function (test: Tinytest.Test, next: () => void) {
      HTTP.call('GET', rootURL, callOpts, (error: Error | null, resp: HTTP.HTTPResponse | undefined): void => {
        test.isTrue(!error);
        if (!error) {
          test.include(resp, 'statusCode', 'response Object is missing "statusCode');
          test.include(resp, 'content', 'response Object is missing "content');
          test.include(resp, 'headers', 'response Object is missing "headers');

          if (resp && resp.headers && resp.content) {
            test.isTrue(resp.statusCode === 200, 'Page received with correct statusCode');
            test.isTrue(resp.headers && !!resp.headers['x-prerender-id'], 'Response has "x-prerender-id" header');
            test.isTrue(resp.headers['x-prerender-id'] && resp.headers['x-prerender-id'].includes('TEST'), 'Value of "x-prerender-id" is correctly set');
            test.isTrue(resp.content.includes('[PASSED]'), 'Response has correct body content');
            test.isTrue(resp.content.includes(rootURL), 'Response has correct ping-back URL');
          }
        }
        next();
      });
    });

    Tinytest.addAsync('[TS] Prerendering & Middleware Setup - Static file', function (test: Tinytest.Test, next: () => void) {
      HTTP.call('GET', rootURL + '/packages/test-in-browser/driver.css', callOpts, (error: Error | null, resp: HTTP.HTTPResponse | undefined): void => {
        test.isTrue(!error);
        if (!error) {
          test.include(resp, 'statusCode', 'response Object is missing "statusCode');
          test.include(resp, 'headers', 'response Object is missing "headers');

          if (resp && resp.headers) {
            test.isTrue(resp.statusCode === 200, 'File received with correct statusCode');
            test.isFalse(resp.headers && !!resp.headers['x-prerender-id'], 'Has no "x-prerender-id" header');
            test.isTrue(resp.headers['content-type'].includes('text/css'), 'Has correct content type header');
          }
        }
        next();
      });
    });

    _.each(testURLs.valid, (testUrl: string, jj: number) => {
      Tinytest.addAsync(`[TS] Test allowed (only) routes - { ${jj} } ${testUrl}`, function (test: Tinytest.Test, next: () => void) {
        HTTP.call('GET', rootURL + testUrl, callOpts, (error: Error | null, resp: HTTP.HTTPResponse | undefined): void => {
          test.isTrue(!error);
          if (!error) {
            test.include(resp, 'statusCode', 'response Object is missing "statusCode');
            test.include(resp, 'content', 'response Object is missing "content');
            test.include(resp, 'headers', 'response Object is missing "headers');

            if (resp && resp.headers && resp.content) {
              test.isTrue(resp.statusCode === 200, 'Page received with correct statusCode');
              test.isTrue(resp.headers && !!resp.headers['x-prerender-id'], 'Response has "x-prerender-id" header');
              test.isTrue(resp.headers['x-prerender-id'] && resp.headers['x-prerender-id'].includes('TEST'), 'Value of "x-prerender-id" is correctly set');
              test.isTrue(resp.content.includes('[PASSED]'), 'Response has correct body content');
              test.isTrue(resp.content.includes(rootURL + testUrl), 'Response has correct ping-back URL');
            }
          }
          next();
        });
      });
    });

    _.each(testURLs.invalid, (testUrl: string, jj: number) => {
      Tinytest.addAsync(`[TS] Test ignored routes - { ${jj} } ${testUrl}`, function (test: Tinytest.Test, next: () => void) {
        HTTP.call('GET', rootURL + testUrl, callOpts, (error: Error | null, resp: HTTP.HTTPResponse | undefined): void => {
          test.isTrue(!error);
          if (!error) {
            test.include(resp, 'statusCode', 'response Object is missing "statusCode');
            test.include(resp, 'content', 'response Object is missing "content');
            test.include(resp, 'headers', 'response Object is missing "headers');

            if (resp && resp.headers && resp.content) {
              test.isTrue(resp.statusCode === 200, 'File received with correct statusCode');
              test.isFalse(resp.headers && !!resp.headers['x-prerender-id'], 'Has no "x-prerender-id" header');
              test.isTrue(resp.content.includes('__meteor_runtime_config__'), 'Response has correct body content');
            }
          }
          next();
        });
      });
    });
  }
});
