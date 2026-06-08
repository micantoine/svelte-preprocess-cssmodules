const compiler = require('../compiler.js');

describe('Native Mode', () => {
  test('Generate CSS Modules and globalize all selectors', async () => {
    const source =
      '<style module>' +
      'span { font-size: 10px; }' +
      '.red { color: red; }' +
      'p + span > strong { font-weight: 600 }' +
      'div *.bold:hover { font-weight: 600 }' +
      '</style>' +
      '<span class="red bold">Red</span>';

    const expectedOutput =
      '<style module>' +
      ':global(span) { font-size: 10px; }' +
      ':global(.red-123) { color: red; }' +
      ':global(p + span > strong) { font-weight: 600 }' +
      ':global(div *.bold-123:hover) { font-weight: 600 }' +
      '</style>' +
      '<span class="red-123 bold-123">Red</span>';

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

  test('Globalize non global selector only', async () => {
    const source =
      '<style module>' +
      '.bold.red:last-child div span.light span.light:first-child { color: red; }' +
      ':global(div) p > strong { font-weight: 600; }' +
      ':global(.bolder:last-child + p:not(:first-child)) p.bold { color: blue; }' +
      '.bolder:last-child + p:not(:first-child) { color: blue; }' +
      '</style>' +
      '<span class="red bold center">Red</span>';

    const expectedOutput =
      '<style module>' +
      ':global(.bold-123.red-123:last-child div span.light-123 span.light-123:first-child) { color: red; }' +
      ':global(div) :global(p > strong) { font-weight: 600; }' +
      ':global(.bolder:last-child + p:not(:first-child)) :global(p.bold-123) { color: blue; }' +
      ':global(.bolder-123:last-child + p:not(:first-child)) { color: blue; }' +
      '</style>' +
      '<span class="red-123 bold-123 center">Red</span>';

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

  test('Globalize class selector inside @media block', async () => {
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
        mode: 'native',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Globalize class selectors inside nested @supports block', async () => {
    const source =
      '<style module>\n' +
      '@supports (display: grid) {\n' +
      '.grid { display: grid; }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="grid">Grid</div>';

    const expectedOutput =
      '<style module>\n' +
      '@supports (display: grid) {\n' +
      ':global(.grid-123) { display: grid; }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="grid-123">Grid</div>';

    const output = await compiler(
      {
        source,
      },
      {
        mode: 'native',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Globalize class selector directly nested inside a rule (CSS nesting)', async () => {
    const source =
      '<style module>\n' +
      '.slider {\n' +
      '  width: 100%;\n' +
      '  .bar { height: 4px; }\n' +
      '  .track { background: grey; }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="slider"><span class="bar"></span><span class="track"></span></div>';

    const expectedOutput =
      '<style module>\n' +
      ':global(.slider-123) {\n' +
      '  width: 100%;\n' +
      '  :global(.bar-123) { height: 4px; }\n' +
      '  :global(.track-123) { background: grey; }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="slider-123"><span class="bar-123"></span><span class="track-123"></span></div>';

    const output = await compiler(
      { source },
      { mode: 'native', localIdentName: '[local]-123' }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Globalize class selector in deeply nested CSS nesting (&.modifier > .child)', async () => {
    const source =
      '<style module>\n' +
      '.wrapper {\n' +
      '  color: black;\n' +
      '  &.active {\n' +
      '    .icon { color: red; }\n' +
      '  }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="wrapper active"><span class="icon"></span></div>';

    const expectedOutput =
      '<style module>\n' +
      ':global(.wrapper-123) {\n' +
      '  color: black;\n' +
      '  :global(&.active-123) {\n' +
      '    :global(.icon-123) { color: red; }\n' +
      '  }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="wrapper-123 active-123"><span class="icon-123"></span></div>';

    const output = await compiler(
      { source },
      { mode: 'native', localIdentName: '[local]-123' }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Globalize class selector nested inside rule inside @media (combined nesting)', async () => {
    const source =
      '<style module>\n' +
      '.slider {\n' +
      '  width: 100%;\n' +
      '  &.vertical {\n' +
      '    .bar { height: 100%; }\n' +
      '  }\n' +
      '  @media (forced-colors: active) {\n' +
      '    .bar { border: 1px solid CanvasText; }\n' +
      '  }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="slider vertical"><span class="bar"></span></div>';

    const expectedOutput =
      '<style module>\n' +
      ':global(.slider-123) {\n' +
      '  width: 100%;\n' +
      '  :global(&.vertical-123) {\n' +
      '    :global(.bar-123) { height: 100%; }\n' +
      '  }\n' +
      '  @media (forced-colors: active) {\n' +
      '    :global(.bar-123) { border: 1px solid CanvasText; }\n' +
      '  }\n' +
      '}\n' +
      '</style>\n' +
      '<div class="slider-123 vertical-123"><span class="bar-123"></span></div>';

    const output = await compiler(
      { source },
      { mode: 'native', localIdentName: '[local]-123' }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Scoped local selector', async () => {
    const source =
      '<style module>' +
      ':local(div) { text-align: right }' +
      '.bold.red:last-child :global(div) span.light span.light:first-child { color: red; }' +
      ':global(div) :local(p > strong) { font-weight: 600; }' +
      ':local(.bolder:last-child + p:not(:first-child)) p.bold { color: blue; }' +
      '.boldest:last-child + :local(p:not(:first-child)) { color: blue; }' +
      '</style>' +
      '<span class="red bold center">Red</span>';

    const expectedOutput =
      '<style module>' +
      'div { text-align: right }' +
      ':global(.bold-123.red-123:last-child) :global(div) :global(span.light-123 span.light-123:first-child) { color: red; }' +
      ':global(div) p > strong { font-weight: 600; }' +
      '.bolder:last-child + p:not(:first-child) :global(p.bold-123) { color: blue; }' +
      ':global(.boldest-123:last-child) + p:not(:first-child) { color: blue; }' +
      '</style>' +
      '<span class="red-123 bold-123 center">Red</span>';

    const output = await compiler(
      {
        source,
      },
      {
        mode: 'native',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });
});
