const compiler = require('../compiler.js');

test('Customize generated classname from getLocalIdent', async () => {
  const output = await compiler({
    source: '<style module="scoped">.red { color: red; }</style><span class="red">Red</span>',
  }, {
    localIdentName: '[local]-123456MC',
    getLocalIdent: (context, { interpolatedName }) => {
      return interpolatedName.toLowerCase();
    },
  });

  expect(output).toBe(
    '<style module="scoped">.red-123456mc { color: red; }</style><span class="red-123456mc">Red</span>'
  );
});

test('Do not process style without the module attribute', async () => {
  const output = await compiler({
    source: '<style>.red { color: red; }</style><span class="red">Red</span>',
  }, {
    localIdentName: '[local]-123',
  });

  expect(output).toBe(
    '<style>.red { color: red; }</style><span class="red">Red</span>'
  );
});

describe('When the mode option has an invalid value', () => {
  const source = '<style module>.red { color: red; }</style>';

  it('throws an exception', async () => {
    await expect(compiler(
      { source },
      { mode: 'svelte' }
    )).rejects.toThrow(
      `Module only accepts 'native', 'mixed' or 'scoped': 'svelte' was passed.`
    );
  });
});

describe('When the module attribute has an invalid value', () => {
  const source = '<style module="svelte">.red { color: red; }</style>';

  it('throws an exception', async () => {
    await expect(compiler({ source })).rejects.toThrow(
      `Module only accepts 'native', 'mixed' or 'scoped': 'svelte' was passed.`
    );
  });
});

