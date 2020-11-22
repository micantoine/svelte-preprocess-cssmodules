const compiler = require('../compiler.js');

const style = '<style>.red { color: red; }</style>';
const source = `${style}\n<span class="$style.red">Red</span>`;
const sourceShorthand = `${style}\n<span class="$.red">Red</span>`;

describe('Generate CSS Modules from HTML attributes, Replace CSS className', () => {
  const expectedOutput =
    '<style>:global(.red-123456) { color: red; }</style>\n<span class="red-123456">Red</span>';
  test('Use default $style.', async () => {
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
  test('Use shorthand $.', async () => {
    const output = await compiler(
      {
        source: sourceShorthand,
      },
      {
        localIdentName: '[local]-123456',
      }
    );

    expect(output).toBe(expectedOutput);
  });
});

describe('Avoid generated class to start with a non character', () => {
  const expectedOutput =
    '<style>:global(._1red) { color: red; }</style>\n<span class="_1red">Red</span>';
  test('Use default $style.', async () => {
    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '1[local]',
      }
    );
    expect(output).toBe(expectedOutput);
  });
  test('Use shorthand $.', async () => {
    const output = await compiler(
      {
        source: sourceShorthand,
      },
      {
        localIdentName: '1[local]',
      }
    );
    expect(output).toBe(expectedOutput);
  });
});

describe('Avoid generated class to end with a hyphen', () => {
  const expectedOutput =
    '<style>:global(.red) { color: red; }</style>\n<span class="red">Red</span>';
  test('Use default $style.', async () => {
    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-',
      }
    );
    expect(output).toBe(expectedOutput);
  });
  test('Use shorthand $.', async () => {
    const output = await compiler(
      {
        source: sourceShorthand,
      },
      {
        localIdentName: '[local]-',
      }
    );
    expect(output).toBe(expectedOutput);
  });
});
