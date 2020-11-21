const compiler = require('../compiler.js');

const style = `<style>\n:global(.error-123) { color:red }\n:global(.success-123) { color:green }\n</style>`;

test('Import all classes from stylesheet', async () => {
  const source =
  `<script>
    import css from './importFixtures/module.css';
  </script>
  <div class={css.error}>Error</div>
  <div class={css.success}>Success</div>`;

  const expected =
  `<script>
    const css = {"error":"error-123","success":"success-123"};
  </script>
  <div class={css.error}>Error</div>
  <div class={css.success}>Success</div>\n${style}`;

  const output = await compiler(
    { source },
    { localIdentName: '[local]-123' }
  );

  expect(output).toBe(expected);
});

test('Destructuring imports', async () => {
  const source =
  `<script>
    import { error, success } from './importFixtures/module.css';
  </script>
  <div class={error}>Error</div>
  <div class={success}>Success</div>`;

  const expected =
  `<script>
    const { error, success } = {"error":"error-123","success":"success-123"};
  </script>
  <div class={error}>Error</div>
  <div class={success}>Success</div>\n${style}`;

  const output = await compiler(
    { source },
    { localIdentName: '[local]-123' }
  );

  expect(output).toBe(expected);
});

test('Unnamed import', async () => {
  const source =
  `<script>
    import './importFixtures/module.css';
  </script>
  <div class="error">Error</div>
  <div class="success">Success</div>`;

  const expected =
  `<script>\n    \n  </script>
  <div class="error">Error</div>
  <div class="success">Success</div>\n` +
  `<style>\n.error { color:red }\n.success { color:green }\n</style>`;

  const output = await compiler(
    { source },
    { localIdentName: '[local]-123' }
  );

  expect(output).toBe(expected);
});

test('Import classname from files including other rules', async () => {
  const source =
  `<script>
    import { error } from './importFixtures/mixed.css';
  </script>
  <section>
  <div class={error}>Error</div>
  <div class="success-message">Success</div>
  </section>`;

  const expected =
  `<script>
    const { error } = {"error":"error-123"};
  </script>
  <section>
  <div class={error}>Error</div>
  <div class="success-message">Success</div>
  </section>\n` +
  `<style>\nsection{ padding:10px }\n:global(.error-123){ color:red }\n.success-message{ color:green }\n</style>`;

  const output = await compiler(
    { source },
    { localIdentName: '[local]-123' }
  );

  expect(output).toBe(expected);
});

test('Imported kebab-case classname transforms to cameCalse', async () => {
  const source =
  `<script>
    import { error, successMessage } from './importFixtures/mixed.css';
  </script>
  <section>
  <div class={error}>Error</div>
  <div class={successMessage}>Success</div>
  </section>`;

  const expected =
  `<script>
    const { error, successMessage } = {"error":"error-123","successMessage":"success-message-123"};
  </script>
  <section>
  <div class={error}>Error</div>
  <div class={successMessage}>Success</div>
  </section>\n` +
  `<style>\nsection{ padding:10px }\n:global(.error-123){ color:red }\n:global(.success-message-123){ color:green }\n</style>`;

  const output = await compiler(
    { source },
    { localIdentName: '[local]-123' }
  );

  expect(output).toBe(expected);
});
