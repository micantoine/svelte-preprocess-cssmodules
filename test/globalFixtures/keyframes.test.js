const compiler = require('../compiler.js');

describe('Scoped Keyframes', () => {
  test('Mixed mode on tag selector', async () => {
    const source =
      '<style module>' +
      'h1 { font-size:18px; animation: fadeIn 2s ease-in; }' +
      '@keyframes fadeIn {0% {opacity:0} 100% {opacity:1}}' +
      '</style>' +
      '<h1>Title</h1>';

    const expectedOutput =
      '<style module>' +
      'h1 { font-size:18px; animation: fadeIn-123 2s ease-in; }' +
      '@keyframes -global-fadeIn-123 {0% {opacity:0} 100% {opacity:1}}' +
      '</style>' +
      '<h1>Title</h1>';

    const output = await compiler(
      {
        source,
      },
      {
        mode: 'mixed',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Mixed mode on tag selector with animation-name property', async () => {
    const source =
      '<style module>' +
      'h1 { font-size:18px; animation-name:fadeIn; animation-duration:2s; animation-timing-function:ease-in; }' +
      '@keyframes fadeIn {0% {opacity:0} 100% {opacity:1}}' +
      '</style>' +
      '<h1>Title</h1>';

    const expectedOutput =
      '<style module>' +
      'h1 { font-size:18px; animation-name:fadeIn-123; animation-duration:2s; animation-timing-function:ease-in; }' +
      '@keyframes -global-fadeIn-123 {0% {opacity:0} 100% {opacity:1}}' +
      '</style>' +
      '<h1>Title</h1>';

    const output = await compiler(
      {
        source,
      },
      {
        mode: 'mixed',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Native mode with multiple animation properties', async () => {
    const source =
      '<style module>' +
      '.title { font-size:18px; animation: fadeIn 2s ease-in, rotate 2s linear infinite; }' +
      '@keyframes fadeIn {from {opacity:0} to {opacity:1}}' +
      '@keyframes rotate {from {transform:rotate(0deg);} to {transform:rotate(360deg);}}' +
      '</style>' +
      '<span class="title">Red</span>';

    const expectedOutput =
      '<style module>' +
      ':global(.title-123) { font-size:18px; animation: fadeIn-123 2s ease-in, rotate-123 2s linear infinite; }' +
      '@keyframes -global-fadeIn-123 {from {opacity:0} to {opacity:1}}' +
      '@keyframes -global-rotate-123 {from {transform:rotate(0deg);} to {transform:rotate(360deg);}}' +
      '</style>' +
      '<span class="title-123">Red</span>';

    const output = await compiler(
      {
        source,
      },
      {
        mode: 'native',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Native move on non global keyframes only', async () => {
    const source =
      '<style module>' +
      '.title { font-size:18px; animation: fadeIn 2s ease-in, rotate 2s linear infinite; }' +
      '@keyframes fadeIn {from {opacity:0} to {opacity:1}}' +
      '@keyframes -global-rotate {from {transform:rotate(0deg);} to {transform:rotate(360deg);}}' +
      '</style>' +
      '<span class="title">Red</span>';

    const expectedOutput =
      '<style module>' +
      ':global(.title-123) { font-size:18px; animation: fadeIn-123 2s ease-in, rotate 2s linear infinite; }' +
      '@keyframes -global-fadeIn-123 {from {opacity:0} to {opacity:1}}' +
      '@keyframes -global-rotate {from {transform:rotate(0deg);} to {transform:rotate(360deg);}}' +
      '</style>' +
      '<span class="title-123">Red</span>';

    const output = await compiler(
      {
        source,
      },
      {
        mode: 'native',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Native mode: class inside @media is hashed when @keyframes is also present', async () => {
    const source =
      '<style module>' +
      '.foo { color: red; }' +
      '@media (forced-colors: active) {' +
      '.foo { color: CanvasText; }' +
      '}' +
      '@keyframes spin {' +
      'from { transform: rotate(0deg); }' +
      'to { transform: rotate(360deg); }' +
      '}' +
      '</style>' +
      '<div class="foo"></div>';

    const expectedOutput =
      '<style module>' +
      ':global(.foo-123) { color: red; }' +
      '@media (forced-colors: active) {' +
      ':global(.foo-123) { color: CanvasText; }' +
      '}' +
      '@keyframes -global-spin-123 {' +
      'from { transform: rotate(0deg); }' +
      'to { transform: rotate(360deg); }' +
      '}' +
      '</style>' +
      '<div class="foo-123"></div>';

    const output = await compiler(
      {
        source,
      },
      {
        mode: 'native',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });

  test('Native mode: class inside @media after @keyframes is hashed', async () => {
    const source =
      '<style module>' +
      '.bar { color: blue; }' +
      '@keyframes pulse {' +
      'from { opacity: 1; }' +
      'to { opacity: 0; }' +
      '}' +
      '@media (prefers-reduced-motion: no-preference) {' +
      '.bar { animation: pulse 1s ease-in-out; }' +
      '}' +
      '</style>' +
      '<span class="bar">Bar</span>';

    const expectedOutput =
      '<style module>' +
      ':global(.bar-123) { color: blue; }' +
      '@keyframes -global-pulse-123 {' +
      'from { opacity: 1; }' +
      'to { opacity: 0; }' +
      '}' +
      '@media (prefers-reduced-motion: no-preference) {' +
      ':global(.bar-123) { animation: pulse-123 1s ease-in-out; }' +
      '}' +
      '</style>' +
      '<span class="bar-123">Bar</span>';

    const output = await compiler(
      {
        source,
      },
      {
        mode: 'native',
        localIdentName: '[local]-123',
      }
    );

    expect(output).toBe(expectedOutput);
  });
});
