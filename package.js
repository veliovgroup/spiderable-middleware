Package.describe({
  name: 'ostrio:spiderable-middleware',
  version: '1.0.2',
  summary: 'Allow your JavaScript website to be crawled perfectly by search engines.',
  git: 'https://github.com/VeliovGroup/spiderable-middleware',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.1');
  api.addFiles('./lib/meteor.js', 'server');
  api.export('Spiderable');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use(['ostrio:spiderable-middleware', 'underscore'], 'server');
  api.addFiles('./lib/meteor-tests.js', 'server');
});

Npm.depends({
  'spiderable-middleware': '1.0.2'
});