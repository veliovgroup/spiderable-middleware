// meteor add webapp
// meteor add ostrio:spiderable-middleware

import { WebApp } from 'meteor/webapp';
import Spiderable from 'meteor/ostrio:spiderable-middleware';

const { handler } = new Spiderable({
  rootURL: 'http://example.com',
  auth: 'test:test'
});

// meteor@>=3
WebApp.connectHandlers.use(handler);
