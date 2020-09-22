const compiler = require('./compiler.js');

const source =
`<style>
  .red { color: red; }
  .red-crimson { color: crimson; }
  .redMajenta { color: magenta; }
</style>
<span class="$style.red">Red</span>
<span class="$style.red-crimson">Crimson</span>
<span class="$style.redMajenta">Majenta</span>`;

const sourceShorthand =
`<style>
  .red { color: red; }
  .red-crimson { color: crimson; }
  .redMajenta { color: magenta; }
</style>
<span class="$.red">Red</span>
<span class="$.red-crimson">Crimson</span>
<span class="$.redMajenta">Majenta</span>`;

const expectedOutput = 
`<style>
  :global(.red-123) { color: red; }
  :global(.red-crimson-123) { color: crimson; }
  :global(.redMajenta-123) { color: magenta; }
</style>
<span class="red-123">Red</span>
<span class="red-crimson-123">Crimson</span>
<span class="redMajenta-123">Majenta</span>`;

test('Target proper className from lookalike classNames', async () => {
  const output = await compiler({
    source,
  }, {
    localIdentName: '[local]-123',
  });

  expect(output).toBe(expectedOutput);
});

test('[Shorthand] Target proper className from lookalike classNames', async () => {
  const output = await compiler({
    source: sourceShorthand,
  }, {
    localIdentName: '[local]-123',
  });

  expect(output).toBe(expectedOutput);
});