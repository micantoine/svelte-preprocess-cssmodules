const compiler = require('./compiler.js');

const source = '<style>.red { color: red; }</style>\n<span class="$style.red">Red</span>';

test('Customize generated classname from getLocalIdentName', async () => {
  const output = await compiler({
    source,
  }, {
    localIdentName: '[local]-123456MC',
    getLocalIdentName: (context, localIdentName) => {
      return localIdentName.interpolated.toLowerCase();
    }
  });

  expect(output).toBe('<style>:global(.red-123456mc) { color: red; }</style>\n<span class="red-123456mc">Red</span>');
});