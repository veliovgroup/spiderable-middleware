Package.describe({
  name: 'ostrio:spiderable-middleware',
  version: '2.1.0',
  summary: 'Ensure Meteor.js apps are flawlessly crawled and indexed by search engines for optimal SEO',
  git: 'https://github.com/veliovgroup/spiderable-middleware',
  documentation: 'README.md'
});

Package.onUse((api) => {
  api.versionsFrom(['1.9.1', '2.1', '3.0.1']);
  api.use('ecmascript', 'server');
  api.mainModule('lib/index.js', 'server');
});

Package.onTest((api) => {
  api.use(['tinytest', 'ecmascript']);
  api.use(['underscore', 'http', 'webapp'], 'server');
  api.addFiles('test/meteor.js', 'server');
});
