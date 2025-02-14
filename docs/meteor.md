# Meteor.js usage

Setup "spiderable" pre-rendering middleware for [Meteor.js](https://www.meteor.com/)-based application

Examples:

- [Middleware example](https://github.com/veliovgroup/spiderable-middleware/blob/master/examples/meteor.middleware.js)
- See [all examples](https://github.com/veliovgroup/spiderable-middleware/tree/master/examples)

## Installation

Install Atmosphere [`webapp`](https://atmospherejs.com/meteor/webapp) and [`ostrio:spiderable-middleware`](https://atmospherejs.com/ostrio/spiderable-middleware) packages

```sh
meteor add webapp
meteor add ostrio:spiderable-middleware
```

__This is SERVER only package. For Meteor.js please make sure library imported and executed only on SERVER.__

## Usage example

Import necessary packages and initiate new `Spiderable` instance

```js
// Make sure this code executed only on SERVER
// Use `if (Meteor.isServer) {/*...*/}` blocks
// or place this code under `/server/` directory
import { WebApp } from 'meteor/webapp';
import Spiderable from 'meteor/ostrio:spiderable-middleware';

const spiderable = new Spiderable({
  auth: 'test:test'
});

// meteor@>=3 use the next line for modern version of Meteor
WebApp.connectHandlers.use(spiderable.handler);

// meteor@<3 use the next line for meteor@2.x and meteor@1.x releases
WebApp.connectHandlers.use(spiderable);
```

## Detect request from Pre-rendering engine in Meteor.js

Pre-rendering engine will set `window.IS_PRERENDERING` global variable to `true`. As in Meteor/Blaze everything should be reactive, let's bound it with `ReactiveVar`:

```js
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

const isPrerendering = new ReactiveVar(window.IS_PRERENDERING || false);
Object.defineProperty(window, 'IS_PRERENDERING', {
  set(val) {
    isPrerendering.set(val);
  },
  get() {
    return isPrerendering.get();
  }
});

// Make globally available Blaze helper,
// Feel free to omit this line in case when Blaze no used
// or going to handle logic in JavaScript part
Template.registerHelper('IS_PRERENDERING', () => isPrerendering.get());
```

__Note__: `window.IS_PRERENDERING` can be `undefined` on initial page load, and may change during runtime.

## Types

Import types right from Atmosphere package

```ts
import Spiderable from 'meteor/ostrio:spiderable-middleware';
import type { SpiderableOptions, NextFunction } from 'meteor/ostrio:spiderable-middleware';

const options: SpiderableOptions = {
  rootURL: 'http://example.com',
  auth: 'test:test',
  debug: false,
  /* ..and other options.. */
};
expectType<SpiderableOptions>(options);

const spiderable = new Spiderable(options);
expectType<Spiderable>(spiderable);

const next: NextFunction = (_err?: unknown): void => {};
expectType<void>(spiderable.handle(req, res, next));
```

## Running Tests

1. Clone this package
2. In Terminal (*Console*) go to directory where package was cloned
3. Then run:

### Meteor/Tinytest

```sh
ROOT_URL=http://127.0.0.1:3003/ meteor test-packages ./ --port 3003

# Run same tests with extra-logging
DEBUG=true ROOT_URL=http://127.0.0.1:3003/ meteor test-packages ./ --port 3003
# PORT is required, and can be changed to any local open port
```

## Get $50 off pre-rendering service

For Meteor-folks who read documentation to the very end — get $50 off the second purchase at __ostr.io__, use [this link](https://ostr.io/signup/gCZWjiBScePWrnnDr) to sign up. *Valid only for new users.*
