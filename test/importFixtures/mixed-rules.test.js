const compiler = require('../compiler.js');

test('Import classname from files including other rules', async () => {
  const source =
  `<script>
    import { error } from './importFixtures/mixed-rules.css';
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
    import { error, successMessage } from './importFixtures/mixed-rules.css';
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
