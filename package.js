Package.describe({
  name: 'ostrio:spiderable-middleware',
  version: '1.6.5',
  summary: 'Allow JavaScript websites to be perfectly crawled and indexed by search engines (SEO)',
  git: 'https://github.com/veliovgroup/spiderable-middleware',
  documentation: 'README.md'
});

Package.onUse((api) => {
  api.versionsFrom('1.9.1');
  api.use('ecmascript', 'server');
  api.mainModule('lib/index.js', 'server');
});

Package.onTest((api) => {
  api.use(['tinytest', 'ecmascript']);
  api.use(['underscore', 'http', 'webapp'], 'server');
  api.addFiles('test/meteor.js', 'server');
});

Npm.depends({
  'request-libcurl': '2.3.4'
});
