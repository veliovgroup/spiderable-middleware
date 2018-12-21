Package.describe({
  name: 'ostrio:spiderable-middleware',
  version: '1.3.4',
  summary: 'Allow your JavaScript website to be crawled perfectly by search engines.',
  git: 'https://github.com/VeliovGroup/spiderable-middleware',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.6.1');
  api.use('ecmascript', 'server');
  api.mainModule('lib/meteor.js', 'server');
});

Package.onTest(function(api) {
  api.use(['tinytest', 'ecmascript']);
  api.use(['ostrio:spiderable-middleware', 'underscore', 'http', 'webapp'], 'server');
  api.addFiles('test/meteor.js', 'server');
});

Npm.depends({
  'spiderable-middleware': '1.3.4'
});
