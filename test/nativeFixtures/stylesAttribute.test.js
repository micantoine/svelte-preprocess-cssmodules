const compiler = require('../compiler.js');

describe('Native Mode', () => {
  test('Generate CSS Modules and globalize all selectors', async () => {
    const source =
    '<style module>'+
    'span { font-size: 10px; }'+
    '.red { color: red; }'+
    'p + span > strong { font-weight: 600 }'+
    'div *.bold:hover { font-weight: 600 }'+
    '</style>'+
    '<span class="red bold">Red</span>';

    const expectedOutput =
    '<style module>'+
    ':global(span) { font-size: 10px; }'+
    ':global(.red-123) { color: red; }'+
    ':global(p + span > strong) { font-weight: 600 }'+
    ':global(div *.bold-123:hover) { font-weight: 600 }'+
    '</style>'+
    '<span class="red-123 bold-123">Red</span>';

    const output = await compiler({
      source,
    },{
      localIdentName: '[local]-123',
    });

    expect(output).toBe(expectedOutput);
  });

  test('Globalize non global selector only', async () => {
    const source =
    '<style module>'+
    '.bold.red:last-child div span.light span.light:first-child { color: red; }'+
    ':global(div) p > strong { font-weight: 600; }'+
    ':global(.bolder:last-child + p:not(:first-child)) p.bold { color: blue; }'+
    '.bolder:last-child + p:not(:first-child) { color: blue; }'+
    '</style>'+
    '<span class="red bold center">Red</span>';

    const expectedOutput =
    '<style module>'+
    ':global(.bold-123.red-123:last-child div span.light-123 span.light-123:first-child) { color: red; }'+
    ':global(div) :global(p > strong) { font-weight: 600; }'+
    ':global(.bolder:last-child + p:not(:first-child)) :global(p.bold-123) { color: blue; }'+
    ':global(.bolder-123:last-child + p:not(:first-child)) { color: blue; }'+
    '</style>'+
    '<span class="red-123 bold-123 center">Red</span>';

    const output = await compiler({
      source,
    },{
      localIdentName: '[local]-123',
    });

    expect(output).toBe(expectedOutput);
  });

  test('Scoped local selector', async () => {
    const source =
    '<style module>'+
    ':local(div) { text-align: right }'+
    '.bold.red:last-child :global(div) span.light span.light:first-child { color: red; }'+
    ':global(div) :local(p > strong) { font-weight: 600; }'+
    ':local(.bolder:last-child + p:not(:first-child)) p.bold { color: blue; }'+
    '.boldest:last-child + :local(p:not(:first-child)) { color: blue; }'+
    '</style>'+
    '<span class="red bold center">Red</span>';

    const expectedOutput =
    '<style module>'+
    'div { text-align: right }'+
    ':global(.bold-123.red-123:last-child) :global(div) :global(span.light-123 span.light-123:first-child) { color: red; }'+
    ':global(div) p > strong { font-weight: 600; }'+
    '.bolder:last-child + p:not(:first-child) :global(p.bold-123) { color: blue; }'+
    ':global(.boldest-123:last-child +) p:not(:first-child) { color: blue; }'+
    '</style>'+
    '<span class="red-123 bold-123 center">Red</span>';

    const output = await compiler({
      source,
    },{
      mode: 'native',
      localIdentName: '[local]-123',
    });

    expect(output).toBe(expectedOutput);
  });

});
