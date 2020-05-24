const svelte = require('svelte/compiler');
const cssModules = require('../index.js');

module.exports = async ({ source, localIdentName }) => {
 const { code } = await svelte.preprocess(
    source,
    [
      cssModules({
        localIdentName,
      })
    ],
    { filename : 'App.svelte' }
  );

  return code;
};