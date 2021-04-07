const compiler = require('../compiler.js');

const source = '<style module="scoped">.red { color: red; }</style><span class="red">Red</span>';

describe('Scoped Mode', () => {
  test('Generate CSS Modules from HTML attributes, Replace CSS className', async () => {
    const output = await compiler({
      source,
    },{
      localIdentName: '[local]-123',
    });

    expect(output).toBe('<style module="scoped">.red-123 { color: red; }</style><span class="red-123">Red</span>');
  });

  test('Avoid generated class to start with a non character', async () => {
    const output = await compiler({
      source,
    }, {
      localIdentName: '1[local]',
    });
    expect(output).toBe('<style module="scoped">._1red { color: red; }</style><span class="_1red">Red</span>');
  });

  test('Avoid generated class to end with a hyphen', async () => {
    const output = await compiler({
      source
    }, {
      localIdentName: '[local]-',
    });
    expect(output).toBe('<style module="scoped">.red { color: red; }</style><span class="red">Red</span>');
  });

  test('Generate class with path token', async () => {
    const output = await compiler({
      source,
    }, {
      localIdentName: '[path][name]__[local]',
    });
    expect(output).toBe('<style module="scoped">.test_App__red { color: red; }</style><span class="test_App__red">Red</span>');
  });

  test('Replace directive', async () => {
    const output = await compiler({
      source: '<style module="scoped">.red { color: red; }</style><span class:red={true}>Red</span>'
    }, {
      localIdentName: '[local]-123',
    });
    expect(output).toBe('<style module="scoped">.red-123 { color: red; }</style><span class:red-123={true}>Red</span>');
  });

  test('Replace Multiple Clasnames on attribute', async () => {
    const output = await compiler({
      source: '<style module="scoped">.red { color: red; } .bold { font-weight: bold }</style><span class="red bold">Red</span>'
    }, {
      localIdentName: '[local]-123',
    });
    expect(output).toBe('<style module="scoped">.red-123 { color: red; } .bold-123 { font-weight: bold }</style><span class="red-123 bold-123">Red</span>');
  });

  test('Replace Clasnames on conditional expression', async () => {
    const output = await compiler({
      source: `<style module="scoped">.red { color: red; } .bold { font-weight: bold }</style><span class="red {true ? 'bold' : 'red'} bold">Red</span>`
    }, {
      localIdentName: '[local]-123',
    });
    expect(output).toBe(`<style module="scoped">.red-123 { color: red; } .bold-123 { font-weight: bold }</style><span class="red-123 {true ? 'bold-123' : 'red-123'} bold-123">Red</span>`);
  });

  test('Replace classname listed in <style> only', async () => {
    const output = await compiler({
      source: `<style module="scoped">.red { color: red; }</style><span class="red bold">Red</span>`
    }, {
      localIdentName: '[local]-123',
    });
    expect(output).toBe(`<style module="scoped">.red-123 { color: red; }</style><span class="red-123 bold">Red</span>`);
  });
});
