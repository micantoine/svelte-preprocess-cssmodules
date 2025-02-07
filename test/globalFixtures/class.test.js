const compiler = require('../compiler.js');

describe('Class Attribute Object', () => {
  test('Shorthand', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; }</style>`
        + `<span class={{red}}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; }</style>`
      + `<span class={{'red-123': red}}>btn</span>`,
    );
  });
  test('Identifier key', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; }</style>`
        + `<span class={{red: active}}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; }</style>`
      + `<span class={{'red-123': active}}>btn</span>`,
    );
  });
  test('Literal key', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; }</style>`
        + `<span class={{'red': active}}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; }</style>`
      + `<span class={{'red-123': active}}>btn</span>`,
    );
  });
  test('Multiple literal keys', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; } .bold { font-weight: bold; }</style>`
        + `<span class={{'red blue bold': active}}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; } :global(.bold-123) { font-weight: bold; }</style>`
      + `<span class={{'red-123 blue bold-123': active}}>btn</span>`,
    );
  });
  test('Multiple conditions', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; } .blue { color: blue; } .bold { font-weight: bold; }</style>`
        + `<span class={{red, blue: !red, 'bold italic': red}}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; } :global(.blue-123) { color: blue; } :global(.bold-123) { font-weight: bold; }</style>`
      + `<span class={{'red-123': red, 'blue-123': !red, 'bold-123 italic': red}}>btn</span>`,
    );
  });
});

describe('Class Attribute Array', () => {
  test('Thruthy value', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; }</style>`
        + `<span class={[active && 'red']}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; }</style>`
      + `<span class={[active && 'red-123']}>btn</span>`,
    );
  });

  test('Combined thruty values', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; } .bold { font-weight: bold; }</style>`
        + `<span class={[ active && 'red', bold && 'bold' ]}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; } :global(.bold-123) { font-weight: bold; }</style>`
      + `<span class={[ active && 'red-123', bold && 'bold-123' ]}>btn</span>`,
    );
  });

  test('Mixed condition', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; } .bold { font-weight: bold; } .italic { font-style: italic; }</style>`
        + `<span class={[ active && 'red bold', !bold && 'light', 'small italic' ]}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; } :global(.bold-123) { font-weight: bold; } :global(.italic-123) { font-style: italic; }</style>`
      + `<span class={[ active && 'red-123 bold-123', !bold && 'light', 'small italic-123' ]}>btn</span>`,
    );
  });

  test('has variables', async () => {
    const output = await compiler(
      {
        source: `<style module>.red { color: red; } .bold { font-weight: bold; }</style>`
        + `<span class={[ 'red bold', bold, props.class ]}>btn</span>`,
      },
      {
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(
      `<style module>:global(.red-123) { color: red; } :global(.bold-123) { font-weight: bold; }</style>`
      + `<span class={[ 'red-123 bold-123', bold, props.class ]}>btn</span>`,
    );
  });
});
