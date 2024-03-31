// meteor add webapp
// meteor add ostrio:spiderable-middleware

import { WebApp } from 'meteor/webapp';
import Spiderable from 'meteor/ostrio:spiderable-middleware';

const spiderable = new Spiderable({
  rootURL: 'http://example.com',
  serviceURL: 'https://render.ostr.io',
  auth: 'APIUser:APIPass'
});

// meteor@>=3
WebApp.connectHandlers.use(spiderable.handler.bind(spiderable));

// meteor@<3, meteor@1.x, meteor@2.x
WebApp.connectHandlers.use(spiderable);
