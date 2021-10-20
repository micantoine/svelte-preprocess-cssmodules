const compiler = require('../compiler.js');

describe('Native Mode Imports', () => {
  test('Imports into existing <style>', async () => {
    const source =
    `<script>
      import style from './assets/class.module.css';
    </script>
    <div class="message {style.error}">Error</div>
    <div class="message {style.success}">Success</div>
    <style module>\n`+
    `.message { font-size: 12px }\n`+
    `</style>`;

    const expectedOutput =
    `<script>
      const style = {"error":"error-123","success":"success-123"};
    </script>
    <div class="message-123 {style.error}">Error</div>
    <div class="message-123 {style.success}">Success</div>
    <style module>\n`+
    `:global(.error-123) { color:red }\n`+
    `:global(.success-123) { color:green }\n`+
    `:global(.message-123) { font-size: 12px }\n`+
    `</style>`;

    const output = await compiler({
      source,
    },{
      mode: 'native',
      localIdentName: '[local]-123',
      parseExternalStylesheet: true,
    });

    expect(output).toBe(expectedOutput);
  });

});
