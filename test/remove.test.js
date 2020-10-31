const compiler = require('./compiler.js');

const source = '<style>.red { color: red; }</style>\n<span class="$style.blue">Blue</span>';
const sourceShorthand = '<style>.red { color: red; }</style>\n<span class="$.blue">Blue</span>';
const expectedOutput = '<style>.red { color: red; }</style>\n<span class="">Blue</span>';

test('Remove unused CSS Modules from HTML attribute', async () => {
  const output = await compiler({
    source,
  }, {
    localIdentName: '[local]-123456',
  });

  expect(output).toBe(expectedOutput);
});
test('[Shorthand] Remove unused CSS Modules from HTML attribute', async () => {
  const output = await compiler({
    source: sourceShorthand,
  }, {
    localIdentName: '[local]-123456',
  });

  expect(output).toBe(expectedOutput);
});

describe('in strict mode', () => {
  test('Throws an exception', async () => {
    await expect(compiler({
      source,
    }, {
      localIdentName: '[local]-123456',
      strict: true,
    })).rejects.toThrow(
      'Classname \"blue\" was not found in declared src/App.svelte <style>'
    );
  });
});
