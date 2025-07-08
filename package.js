Package.describe({
  name: 'ostrio:spiderable-middleware',
  version: '2.3.0',
  summary: 'Boost organic traffic and enable SEO for Meteor.js application',
  git: 'https://github.com/veliovgroup/spiderable-middleware',
  documentation: 'README.md'
});

Package.onUse((api) => {
  api.versionsFrom(['1.9.1', '2.1', '3.0.1']);
  api.use('ecmascript', 'server');
  api.mainModule('lib/index.js', 'server');

  api.use(['zodern:types@1.0.13', 'typescript'], 'server', { weak: true });
  api.addAssets('types/index.d.ts', 'server');
});

Package.onTest((api) => {
  api.use(['tinytest', 'ecmascript', 'typescript', 'zodern:types']);
  api.use(['underscore', 'http', 'webapp', 'ostrio:spiderable-middleware'], 'server');
  api.addFiles(['test/meteor.js', 'test/meteor.ts'], 'server');
});
