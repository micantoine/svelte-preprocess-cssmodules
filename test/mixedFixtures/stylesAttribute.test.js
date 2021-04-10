const compiler = require('../compiler.js');

describe('Mixed Mode', () => {

  test('Chain Selector', async () => {
    const source =
      '<style module>span.red.large:hover { font-size: 20px; } \n.red { color: red; }</style>\n'+
      '<span class="red large">Red</span>';

    const expectedOutput =
      '<style module>:global(span.red-123456.large-123456:hover) { font-size: 20px; } \n:global(.red-123456) { color: red; }</style>\n'+
      '<span class="red-123456 large-123456">Red</span>';

    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-123456',
        mode: 'mixed',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('CSS Modules class targetting children', async () => {
    const source =
      '<style module>\n' +
      'div.red > sup { font-size: 12px; }\n' +
      '.red { color: red; }\n' +
      '</style>\n' +
      '<div class="red">Red<sup>*</sup></div>';

    const expectedOutput =
      '<style module>\n' +
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
        mode: 'mixed',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('CSS Modules class has a parent', async () => {
    const source =
      '<style module>\n' +
      'div .semibold .red { font-size: 20px; }\n' +
      '.red { color: red; }\n' +
      '.semibold { font-weight: 600; }\n' +
      '</style>\n' +
      '<div><strong class="semibold"><span class="red">Red</span></strong></div>';

    const expectedOutput =
      '<style module>\n' +
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
        mode: 'mixed',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('CSS Modules chaining pseudo selector', async () => {
    const source =
      '<style module>\n' +
      '.bolder:last-child + p:not(:first-child) { font-size: 20px; }\n' +
      ':global(.bolder:last-child + p:not(:first-child)) p.bold { color: red; }\n' +
      '.bold.red:last-child div span.light span.light:first-child:hover { color: red; }\n' +
      '</style>\n' +
      '<div><span class="red">Red</span></div>';

    const expectedOutput =
      '<style module>\n' +
      ':global(.bolder-123:last-child) + p:not(:first-child) { font-size: 20px; }\n' +
      ':global(.bolder:last-child + p:not(:first-child)) :global(p.bold-123) { color: red; }\n' +
      ':global(.bold-123.red-123:last-child) div :global(span.light-123) :global(span.light-123:first-child:hover) { color: red; }\n' +
      '</style>\n' +
      '<div><span class="red-123">Red</span></div>';

    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-123',
        mode: 'mixed',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('CSS Modules class is used within a media query', async () => {
    const source =
      '<style module>\n' +
      '@media (min-width: 37.5em) {\n' +
      '.red { color: red; }\n' +
      'div.bold { font-weight: bold; }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="bold"><span class="red">Red</span></div>';

    const expectedOutput =
      '<style module>\n' +
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
        mode: 'mixed',
      }
    );

    expect(output).toBe(expectedOutput);
  });

});
