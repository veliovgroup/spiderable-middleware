const nodeMajor = Number(process.versions.node.split('.')[0]);

// Test files are picked by npm scripts, see "test" and "test:integration" in package.json
module.exports = {
  extension: ['js', 'ts'],
  timeout: 10000,
  // Node@22+ loads `test/npm.ts` with built-in type stripping and warns
  // that this CommonJS package has no "type" field, silence that warning only
  ...(nodeMajor >= 22 ? { 'node-option': ['disable-warning=MODULE_TYPELESS_PACKAGE_JSON'] } : {}),
};
