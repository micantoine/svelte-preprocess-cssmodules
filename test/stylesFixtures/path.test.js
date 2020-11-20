const compiler = require('../compiler.js');

const source = '<style>.red { color: red; }</style>\n<span class="$style.red">Red</span>';
const sourceReactiveClass =
  '<style>.red { color: red; }</style>\n<span class:$.red={true}>Red</span>';

test('Replace path on regular class', async () => {
  const output = await compiler(
    {
      source,
    },
    {
      localIdentName: '[path][name]__[local]',
    }
  );

  expect(output).toBe(
    '<style>:global(.test_App__red) { color: red; }</style>\n<span class="test_App__red">Red</span>'
  );
});

test('Replace path on reactive class', async () => {
  const output = await compiler(
    {
      source: sourceReactiveClass,
    },
    {
      localIdentName: '[path][name]__[local]',
    }
  );

  expect(output).toBe(
    '<style>:global(.test_App__red) { color: red; }</style>\n<span class:test_App__red={true}>Red</span>'
  );
});
