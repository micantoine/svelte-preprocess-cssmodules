const compiler = require('./compiler.js');

const source = '<style>.red { color: red; }</style>\n<span class="$style.red">Red</span>';

test('Generate CSS Modules from HTML attributes, Replace CSS className', async () => {
  const output = await compiler({
    source,
    localIdentName: '[local]-123456',
  });

  expect(output).toBe('<style>:global(.red-123456) { color: red; }</style>\n<span class="red-123456">Red</span>');
});

test('Avoid generated class to start with a non character', async () => {
  const output = await compiler({
    source,
    localIdentName: '1[local]',
  });
  expect(output).toBe('<style>:global(._1red) { color: red; }</style>\n<span class="_1red">Red</span>');
});

test('Avoid generated class to end with a hyphen', async () => {
  const output = await compiler({
    source,
    localIdentName: '[local]-',
  });
  expect(output).toBe('<style>:global(.red) { color: red; }</style>\n<span class="red">Red</span>');
});
