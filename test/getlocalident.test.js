const compiler = require('./compiler.js');

const source = '<style>.red { color: red; }</style>\n<span class="$style.red">Red</span>';

test('Customize generated classname from getLocalIdent', async () => {
  const output = await compiler(
    {
      source,
    },
    {
      localIdentName: '[local]-123456MC',
      getLocalIdent: (context, { interpolatedName }) => {
        return interpolatedName.toLowerCase();
      },
    }
  );

  expect(output).toBe(
    '<style>:global(.red-123456mc) { color: red; }</style>\n<span class="red-123456mc">Red</span>'
  );
});
