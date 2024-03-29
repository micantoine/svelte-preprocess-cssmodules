const svelte = require('svelte/compiler');
const cssModules = require('../');

module.exports = async ({ source }, options) => {
  const { code } = await svelte.preprocess(source, [cssModules(options)], {
    filename: 'test/App.svelte',
  });

  return code;
};
