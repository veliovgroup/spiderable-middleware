Package.describe({
  name: 'ostrio:spiderable-middleware',
  version: '1.1.0',
  summary: 'Allow your JavaScript website to be crawled perfectly by search engines.',
  git: 'https://github.com/VeliovGroup/spiderable-middleware',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4');
  api.use('ecmascript', 'server');
  api.mainModule('./lib/meteor.js', 'server');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'ecmascript']);
  api.use(['ostrio:spiderable-middleware', 'underscore'], 'server');
  api.addFiles('./lib/meteor-tests.js', 'server');
});

Npm.depends({
  'spiderable-middleware': '1.1.0'
});