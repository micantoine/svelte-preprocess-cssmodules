const compiler = require('../compiler.js');

describe('Scoped Keyframes', () => {
  test('Mixed mode on tag selector', async () => {
    const source =
    '<style module>'+
    'h1 { font-size:18px; animation: fadeIn 2s ease-in; }'+
    '@keyframes fadeIn {0% {opacity:0} 100% {opacity:1}}'+
    '</style>'+
    '<h1>Title</h1>';

    const expectedOutput =
    '<style module>'+
    'h1 { font-size:18px; animation: fadeIn-123 2s ease-in; }'+
    '@keyframes -global-fadeIn-123 {0% {opacity:0} 100% {opacity:1}}'+
    '</style>'+
    '<h1>Title</h1>';

    const output = await compiler({
      source,
    },{
      mode: 'mixed',
      localIdentName: '[local]-123',
    });

    expect(output).toBe(expectedOutput);
  });

  test('Native mode with multiple animation properties', async () => {
    const source =
    '<style module>'+
    '.title { font-size:18px; animation: fadeIn 2s ease-in, rotate 2s linear infinite; }'+
    '@keyframes fadeIn {from {opacity:0} to {opacity:1}}'+
    '@keyframes rotate {from {transform:rotate(0deg);} to {transform:rotate(360deg);}'+
    '</style>'+
    '<span class="title">Red</span>';

    const expectedOutput =
    '<style module>'+
    ':global(.title-123) { font-size:18px; animation: fadeIn-123 2s ease-in, rotate-123 2s linear infinite; }'+
    '@keyframes -global-fadeIn-123 {from {opacity:0} to {opacity:1}}'+
    '@keyframes -global-rotate-123 {from {transform:rotate(0deg);} to {transform:rotate(360deg);}'+
    '</style>'+
    '<span class="title-123">Red</span>';

    const output = await compiler({
      source,
    },{
      mode: 'native',
      localIdentName: '[local]-123',
    });

    expect(output).toBe(expectedOutput);
  });

   test('Native move on non global keyframes only', async () => {
    const source =
    '<style module>'+
    '.title { font-size:18px; animation: fadeIn 2s ease-in, rotate 2s linear infinite; }'+
    '@keyframes fadeIn {from {opacity:0} to {opacity:1}}'+
    '@keyframes -global-rotate {from {transform:rotate(0deg);} to {transform:rotate(360deg);}'+
    '</style>'+
    '<span class="title">Red</span>';

    const expectedOutput =
    '<style module>'+
    ':global(.title-123) { font-size:18px; animation: fadeIn-123 2s ease-in, rotate 2s linear infinite; }'+
    '@keyframes -global-fadeIn-123 {from {opacity:0} to {opacity:1}}'+
    '@keyframes -global-rotate {from {transform:rotate(0deg);} to {transform:rotate(360deg);}'+
    '</style>'+
    '<span class="title-123">Red</span>';

    const output = await compiler({
      source,
    },{
      mode: 'native',
      localIdentName: '[local]-123',
    });

    expect(output).toBe(expectedOutput);
  });
});
