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

test('Use the filepath only as hash seeder', async () => {
  const output = await compiler({
    source: '<style module>.red { color: red; } .bold { color: bold; }</style><span class="red bold">Red</span>',
  }, {
    localIdentName: '[local]-[hash:6]',
    hashSeeder: ['filepath'],
  });

  expect(output).toBe(
    '<style module>:global(.red-727f4c) { color: red; } :global(.bold-727f4c) { color: bold; }</style><span class="red-727f4c bold-727f4c">Red</span>'
  );
});

describe('When the hashSeeder has a wrong key', () => {
  const source = '<style module>.red { color: red; }</style>';

  it('throws an exception', async () => {
    await expect(compiler({
      source
    }, {
      hashSeeder: ['filepath', 'content'],
    })).rejects.toThrow(
      `The hash seeder only accepts the keys 'style', 'filepath' and 'classname': 'content' was passed.`
    );
  });
});

describe('When the preprocessor is set as default scoping', () => {
  it('parses the style tag with no module attributes', async () => {
    const source = '<style>.red { color: red; }</style><p class="red">red</p>';
    const output = await compiler({
      source
    }, {
      localIdentName: '[local]-123',
      useAsDefaultScoping: true,
    });

    expect(output).toBe('<style>:global(.red-123) { color: red; }</style><p class="red-123">red</p>')
  });

  it('parses the style tag with module attributes', async () => {
    const source = '<style module="scoped">.red { color: red; }</style><p class="red">red</p>';
    const output = await compiler({
      source
    }, {
      localIdentName: '[local]-123',
      useAsDefaultScoping: true,
    });

    expect(output).toBe('<style module="scoped">.red-123 { color: red; }</style><p class="red-123">red</p>')
  });

  it('does not parse when `parseStyleTag` is off', async () => {
    const source = '<style module="scoped">.red { color: red; }</style><p class="red">red</p>';
    const output = await compiler({
      source
    }, {
      localIdentName: '[local]-123',
      parseStyleTag: false,
      useAsDefaultScoping: true,
    });

    expect(output).toBe('<style module="scoped">.red { color: red; }</style><p class="red">red</p>')
  });

  it('does not parse when the style tag does not exist', async () => {
    const source = '<p class="red">red</p>';
    const output = await compiler({
      source
    }, {
      useAsDefaultScoping: true,
    });

    expect(output).toBe('<p class="red">red</p>')
  });
});

