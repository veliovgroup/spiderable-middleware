Package.describe({
  name: 'ostrio:spiderable-middleware',
  version: '1.4.2',
  summary: 'Allow your JavaScript website to be crawled perfectly by search engines.',
  git: 'https://github.com/VeliovGroup/spiderable-middleware',
  documentation: 'README.md'
});

Package.onUse((api) => {
  api.versionsFrom('1.6.1');
  api.use('ecmascript', 'server');
  api.mainModule('lib/index.js', 'server');
});

Package.onTest((api) => {
  api.use(['tinytest', 'ecmascript']);
  api.use(['ostrio:spiderable-middleware', 'underscore', 'http', 'webapp'], 'server');
  api.addFiles('test/meteor.js', 'server');
});

Npm.depends({
  'request-libcurl': '1.0.3'
});
