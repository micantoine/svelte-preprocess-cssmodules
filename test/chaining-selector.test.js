const compiler = require('./compiler.js');

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

describe('Classname is part of a selector', () => {
  test('CSS Modules class targetting children', async () => {
    const source =
      '<style>\n' +
      'div.red > sup { font-size: 12px; }\n' +
      '.red { color: red; }\n' +
      '</style>\n' +
      '<div class="$style.red">Red<sup>*</sup></div>';

    const expectedOutput =
      '<style>\n' +
      ':global(div.red-123) > sup { font-size: 12px; }\n' +
      ':global(.red-123) { color: red; }\n' +
      '</style>\n' +
      '<div class="red-123">Red<sup>*</sup></div>';

    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('CSS Modules class has a parent', async () => {
    const source =
      '<style>\n' +
      'div .semibold .red { font-size: 20px; }\n' +
      '.red { color: red; }\n' +
      '.semibold { font-weight: 600; }\n' +
      '</style>\n' +
      '<div><strong class="$style.semibold"><span class="$style.red">Red</span></strong></div>';

    const expectedOutput =
      '<style>\n' +
      'div :global(.semibold-123) :global(.red-123) { font-size: 20px; }\n' +
      ':global(.red-123) { color: red; }\n' +
      ':global(.semibold-123) { font-weight: 600; }\n' +
      '</style>\n' +
      '<div><strong class="semibold-123"><span class="red-123">Red</span></strong></div>';

    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('CSS Modules class has a global parent', async () => {
    const source =
      '<style>\n' +
      ':global(div) .red { font-size: 20px; }\n' +
      '.red { color: red; }\n' +
      '</style>\n' +
      '<div><span class="$style.red">Red</span></div>';

    const expectedOutput =
      '<style>\n' +
      ':global(div) :global(.red-123) { font-size: 20px; }\n' +
      ':global(.red-123) { color: red; }\n' +
      '</style>\n' +
      '<div><span class="red-123">Red</span></div>';

    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('CSS Modules class is used within a media query', async () => {
    const source =
      '<style>\n' +
      '@media (min-width: 37.5em) {\n' +
      '.red { color: red; }\n' +
      'div.bold { font-weight: bold; }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="$style.bold"><span class="$style.red">Red</span></div>';

    const expectedOutput =
      '<style>\n' +
      '@media (min-width: 37.5em) {\n' +
      ':global(.red-123) { color: red; }\n' +
      ':global(div.bold-123) { font-weight: bold; }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="bold-123"><span class="red-123">Red</span></div>';

    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });
});
