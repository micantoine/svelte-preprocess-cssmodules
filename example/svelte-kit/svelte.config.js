import cssModules from '../../dist/index.mjs';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte'
	},
  preprocess: [
    cssModules({
      includePaths: ['./']
    }),
  ]
};

export default config;
