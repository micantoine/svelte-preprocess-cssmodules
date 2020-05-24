const compiler = require('./compiler.js');

const source = '<style>.red { color: red; }</style>\n<span class="$style.blue">Blue</span>';

test('Remove unused CSS Modules from HTML attribute', async () => {
  const output = await compiler({
    source,
    localIdentName: '[local]-123456',
  });

  expect(output).toBe('<style>.red { color: red; }</style>\n<span class="">Blue</span>');
});