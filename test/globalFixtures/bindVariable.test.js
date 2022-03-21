const compiler = require('../compiler.js');

const script = "<script>let color = 'blue';</script>";

describe('Bind variable to CSS', () => {
  test('root elements', async () => {
    const output = await compiler({
      source: `${script}<div>blue</div><div>red</div><style module>div{color:bind(color)}</style>`,
    }, {
      cssVariableHash: '123',
    });

    expect(output).toBe(
      `${script}<div style="--color-123:{color};">blue</div><div style="--color-123:{color};">red</div><style module>:global(div){color:var(--color-123)}</style>`
    );
  });

  test('root element with attributes', async () => {
    const output = await compiler({
      source: `${script}<div class="blue">blue</div><style module>.blue{color:bind(color)}</style>`,
    }, {
      cssVariableHash: '123',
      localIdentName: '[local]-123',
    });

    expect(output).toBe(
      `${script}<div class="blue-123" style="--color-123:{color};">blue</div><style module>:global(.blue-123){color:var(--color-123)}</style>`
    );
  });

  test('root element with style attribute', async () => {
    const output = await compiler({
      source: `${script}<div style="display:block">blue</div><style module>div{color:bind(color)}</style>`,
    }, {
      cssVariableHash: '123',
    });

    expect(output).toBe(
      `${script}<div style="--color-123:{color};display:block">blue</div><style module>:global(div){color:var(--color-123)}</style>`
    );
  });

  test('element wrapped by a root component', async () => {
    const output = await compiler({
      source: `${script}<Component><div>blue</div></Component><style module>div{color:bind(color)}</style>`,
    }, {
      cssVariableHash: '123',
    });

    expect(output).toBe(
      `${script}<Component><div style="--color-123:{color};">blue</div></Component><style module>:global(div){color:var(--color-123)}</style>`
    );
  });
});
