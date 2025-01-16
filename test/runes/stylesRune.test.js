const compiler = require('../compiler.js');

const source = '<style module>.red { color: red; }</style><span test={$css("red")}>Red</span>';

describe('Rune', () => {
  test('Works in markup', async () => {
    const output = await compiler(
      {
        source,
      },
      {
        localIdentName: '[local]-123',
        rune: true
      }
    );

    expect(output).toBe(
      '<style module>:global(.red-123) { color: red; }</style><span test={"red-123"}>Red</span>'
    );
  });

  test('Works in combination with class', async () => {
    const output = await compiler(
      {
        source: '<style module>.red { color: red; }</style><span class={$css("red")}>Red</span>'
      },
      {
        localIdentName: '[local]-123',
        rune: true
      }
    );

    expect(output).toBe(
      '<style module>:global(.red-123) { color: red; }</style><span class={"red-123"}>Red</span>'
    );
  });

  test('Works in script', async () => {
    const output = await compiler(
      {
        source: '<style module>.red { color: red; }</style><script>const someClass = $css("red")</script>'
      },
      {
        localIdentName: '[local]-123',
        rune: true
      }
    );

    expect(output).toBe(
      '<style module>:global(.red-123) { color: red; }</style><script>const someClass = "red-123"</script>'
    );
  });

  test('Respects option', async () => {
    const output = await compiler(
      {
        source: source + '<script>const someClass = $css("red")</script>'
      },
      {
        localIdentName: '[local]-123',
        rune: false
      }
    );

    expect(output).toBe(
      '<style module>:global(.red-123) { color: red; }</style><span test={$css("red")}>Red</span><script>const someClass = $css("red")</script>'
    );
  });

  test('Large component', async () => {
    const source = `
      <script>
        const test = $css("red");
        const statement = true? $css("blue") : $css("green");
        function testFunction() {
          return $css("red");
        }
      </script>
      <style module>
        .red { color: red; }
        .blue { color: blue; }
        .green { color: green; }
      </style>
      <span test={$css("red")}>Red</span>
      <span class={$css("blue")}>Blue</span>
      <span lol={$css("green")}>Green</span>
    `;
    const result = `
      <script>
        const test = "red-123";
        const statement = true? "blue-123" : "green-123";
        function testFunction() {
          return "red-123";
        }
      </script>
      <style module>
        :global(.red-123) { color: red; }
        :global(.blue-123) { color: blue; }
        :global(.green-123) { color: green; }
      </style>
      <span test={"red-123"}>Red</span>
      <span class={"blue-123"}>Blue</span>
      <span lol={"green-123"}>Green</span>
    `;
    const output = await compiler(
      {
        source
      },
      {
        localIdentName: '[local]-123',
        rune: true
      }
    );

    expect(output).toBe(result);
  });
});
