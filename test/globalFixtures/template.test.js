const compiler = require('../compiler.js');

test('Replace multiline class attribute', async () => {
  const output = await compiler({
    source: `<style module>.red { color: red; } .strong { font-weight: bold; }</style><span class="btn
    red
    strong
    main
    ">btn</span>`,
  }, {
    localIdentName: '[local]-123',
  });

  expect(output).toBe(
    `<style module>:global(.red-123) { color: red; } :global(.strong-123) { font-weight: bold; }</style><span class="btn
    red-123
    strong-123
    main
    ">btn</span>`
  );
});

