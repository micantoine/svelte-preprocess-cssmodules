const compiler = require('../compiler.js');

const source = `<style>.red { color: red; }</style>
<span
  class:$style.red={true}
  class="{true ? '$style.red' : ''}">Red</span>
`;
const sourceShorthand = `<style>.red { color: red; }</style>
<span
  class:$.red={true}
  class="{true ? '$.red' : ''}">Red</span>
`;

const expectedOutput = `<style>:global(.red-123456) { color: red; }</style>
<span
  class:red-123456={true}
  class="{true ? 'red-123456' : ''}">Red</span>
`;

test('Generate CSS Modules className on class binding', async () => {
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

test('[Shorthand] Generate CSS Modules className on class binding', async () => {
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
