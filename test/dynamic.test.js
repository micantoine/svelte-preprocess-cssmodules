const compiler = require('./compiler.js');

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
