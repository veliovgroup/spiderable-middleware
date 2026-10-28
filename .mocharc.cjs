const nodeMajor = Number(process.versions.node.split('.')[0]);

module.exports = {
  require: ['ts-node/register'],
  extension: ['js', 'ts'],
  spec: 'test/**/npm.@(mjs|js|ts)',
  // Node@22+ loads `test/npm.ts` with built-in type stripping and warns
  // that this CommonJS package has no "type" field, silence that warning only
  ...(nodeMajor >= 22 ? { 'node-option': ['disable-warning=MODULE_TYPELESS_PACKAGE_JSON'] } : {}),
};
