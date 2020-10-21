const compiler = require('./compiler.js');

const style = '<style>.red { color: red; }</style>';
const source = style + '\n<span class="$style.red">Red</span>';
const sourceShorthand = style + '\n<span class="$.red">Red</span>';

test('Generate CSS Modules from HTML attributes, Replace CSS className', async () => {
  const output = await compiler({
    source,
  }, {
    localIdentName: '[local]-123456',
  });

  expect(output).toBe('<style>:global(.red-123456) { color: red; }</style>\n<span class="red-123456">Red</span>');
});
test('[Shorthand] Generate CSS Modules from HTML attributes, Replace CSS className', async () => {
  const output = await compiler({
    source: sourceShorthand,
  }, {
    localIdentName: '[local]-123456',
  });

  expect(output).toBe('<style>:global(.red-123456) { color: red; }</style>\n<span class="red-123456">Red</span>');
});

test('Avoid generated class to start with a non character', async () => {
  const output = await compiler({
    source,
  }, {
    localIdentName: '1[local]',
  });
  expect(output).toBe('<style>:global(._1red) { color: red; }</style>\n<span class="_1red">Red</span>');
});
test('[Shorthand] Avoid generated class to start with a non character', async () => {
  const output = await compiler({
    source: sourceShorthand,
  }, {
    localIdentName: '1[local]',
  });
  expect(output).toBe('<style>:global(._1red) { color: red; }</style>\n<span class="_1red">Red</span>');
});

test('Avoid generated class to end with a hyphen', async () => {
  const output = await compiler({
    source,
  }, {
    localIdentName: '[local]-',
  });
  expect(output).toBe('<style>:global(.red) { color: red; }</style>\n<span class="red">Red</span>');
});
test('[Shorthand] Avoid generated class to end with a hyphen', async () => {
  const output = await compiler({
    source: sourceShorthand,
  }, {
    localIdentName: '[local]-',
  });
  expect(output).toBe('<style>:global(.red) { color: red; }</style>\n<span class="red">Red</span>');
});

describe('combining multiple classes', () => {
  const style = '<style>span.red.large:hover { font-size: 20px; } \n.red { color: red; }</style>';
  const source = style + '\n<span class="$style.red $style.large">Red</span>';

  const expectedStyle =
    '<style>:global(span.red-123456.large-123456:hover) { font-size: 20px; } \n:global(.red-123456) { color: red; }</style>';
  const expectedOutput = expectedStyle + '\n<span class="red-123456 large-123456">Red</span>';

  test('Generate CSS Modules from HTML attributes, Replace CSS className', async () => {
    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-123456',
      }
    );

    expect(output).toBe(expectedOutput);
  });
});

describe('using dynamic classes', () => {
  describe('when matched class is empty', () => {
    // The parser will identify a class named ''
    const source =
      '<style>.red { font-size: 20px; }</style>' + '<span class={`$style.${color}`}>Red</span>';

    test('throws an exception', async () => {
      await expect(compiler({ source })).rejects.toThrow(
        'Invalid class name in file src/App.svelte.\nThis usually happens when using dynamic classes with svelte-preprocess-cssmodules.'
      );
    });
  });

  describe('when matched class could be a valid class but does not match any style definition', () => {
    // The parser will identify a class named 'color'
    const source =
      '<style>.colorred { font-size: 20px; }</style>' +
      '<span class={`$style.color${color}`}>Red</span>';

    it('in strict mode, it throw an exception', async () => {
      await expect(compiler({ source }, { strict: true })).rejects.toThrow(
        'Classname "color" was not found in declared src/App.svelte <style>'
      );
    });

    // TODO: fix, this is probably not a result one would expect
    it('in non-strict mode, it removes the resulting class', async () => {
      const output = await compiler({ source }, { strict: false });
      expect(output).toEqual(
        '<style>.colorred { font-size: 20px; }</style><span class={`${color}`}>Red</span>'
      );
    });
  });

  describe('when matched class is an invalid class', () => {
    // The parser will identify a class named 'color-'
    const source =
      '<style>.color-red { font-size: 20px; }</style>' +
      '<span class={`$style.color-${color}`}>Red</span>';

    it('throws an exception when resulting class is invalid', async () => {
      await expect(compiler({ source })).rejects.toThrow('Classname "color-" in file src/App.svelte is not valid');
    });
  });
});
