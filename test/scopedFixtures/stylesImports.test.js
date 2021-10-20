const compiler = require('../compiler.js');

describe('Scoped Mode Imports', () => {
  test('do no apply styling', async () => {
    const source =
    `<script>
      import style from './assets/class.module.css';
    </script>
    <div class:style.error={true}>Error</div>
    <div class:style.success={true}>Success</div>`;

    const expectedOutput =
    `<script>
      import style from './assets/class.module.css';
    </script>
    <div class:style.error={true}>Error</div>
    <div class:style.success={true}>Success</div>`;

    const output = await compiler({
      source,
    },{
      mode: 'scoped',
      localIdentName: '[local]-123',
    });

    expect(output).toBe(expectedOutput);
  });

  test('Import all classes from stylesheet', async () => {
    const source =
    `<script>
      import css from './assets/class.module.css';
    </script>
    <div class={css.error}>Error</div>
    <div class={css.success}>Success</div>`;

    const expectedOutput =
    `<script>
      const css = {"error":"error-123","success":"success-123"};
    </script>
    <div class={css.error}>Error</div>
    <div class={css.success}>Success</div>`+
    `<style module>\n`+
    `.error-123 { color:red }\n`+
    `.success-123 { color:green }</style>`;

    const output = await compiler({
      source,
    },{
      mode: 'scoped',
      localIdentName: '[local]-123',
      parseExternalStylesheet: true,
    });

    expect(output).toBe(expectedOutput);
  });

  test('Destructuring imports', async () => {
    const source =
    `<script>
      import { error, success } from './assets/class.module.css';
    </script>
    <div class={error}>Error</div>
    <div class={success}>Success</div>`;

    const expectedOutput =
    `<script>
      const { error, success } = {"error":"error-123","success":"success-123"};
    </script>
    <div class={error}>Error</div>
    <div class={success}>Success</div>`+
    `<style module>\n`+
    `.error-123 { color:red }\n`+
    `.success-123 { color:green }</style>`;

    const output = await compiler({
      source,
    },{
      mode: 'scoped',
      localIdentName: '[local]-123',
      parseExternalStylesheet: true,
    });

    expect(output).toBe(expectedOutput);
  });

  test('multiple selectors imported', async () => {
    const source =
    `<script>
      import { successMessage } from './assets/style.module.css';
    </script>
    <div class:successMessage={true}>Success</div>
    <div class="error">Error</div>`;

    const expectedOutput =
    `<script>
      const { successMessage } = {"successMessage":"success-message-123"};
    </script>
    <div class:sucess-message-123={true}>Success</div>
    <div class="error-123">Error</div>`+
    `<style module>\n`+
    `section { padding:10px }\n`+
    `.error-123 { color:red }\n`+
    `.success-message-123 { color:green }</style>`;

    const output = await compiler({
      source
    },{
      mode: 'scoped',
      localIdentName: '[local]-123',
      parseExternalStylesheet: true,
    });
  });

  test('Class directives with default specifier', async () => {
    const source =
    `<script>
      import style from './assets/class.module.css';
    </script>
    <div class:style.error={true}>Error</div>
    <div class:style.success={true}>Success</div>`;

    const expectedOutput =
    `<script>
      const style = {"error":"error-123","success":"success-123"};
    </script>
    <div class:error-123={true}>Error</div>
    <div class:success-123={true}>Success</div>`+
    `<style module>\n`+
    `.error-123 { color:red }\n`+
    `.success-123 { color:green }</style>`;

    const output = await compiler({
      source,
    },{
      mode: 'scoped',
      localIdentName: '[local]-123',
      parseExternalStylesheet: true,
    });

    expect(output).toBe(expectedOutput);
  });

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
    `.error-123 { color:red }\n`+
    `.success-123 { color:green }\n`+
    `.message-123 { font-size: 12px }\n`+
    `</style>`;

    const output = await compiler({
      source,
    },{
      mode: 'scoped',
      localIdentName: '[local]-123',
      parseExternalStylesheet: true,
    });

    expect(output).toBe(expectedOutput);
  });
});
