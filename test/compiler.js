const svelte = require('svelte/compiler');
const cssModules = require('../dist/index.js');

module.exports = async ({ source }, options) => {
  const { code } = await svelte.preprocess(
    source,
    [
      cssModules(options)
    ],
    { filename : 'src/App.svelte' }
  );

  return code;
};
