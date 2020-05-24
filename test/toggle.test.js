const compiler = require('./compiler.js');

const source =
`<style>.red { color: red; }</style>
<span
  class:$style.red={true}
  class="{true ? '$style.red' : ''}">Red</span>
`;

test('Generate CSS Modules className on class binding', async () => {
  const output = await compiler({
    source,
    localIdentName: '[local]-123456',
  });

  expect(output).toBe(
`<style>:global(.red-123456) { color: red; }</style>
<span
  class:red-123456={true}
  class="{true ? 'red-123456' : ''}">Red</span>
`);
});

