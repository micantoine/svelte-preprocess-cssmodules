// const compiler = require('../compiler.js');

// const style = `<style>\n:global(.error-123) { color:red }\n:global(.success-123) { color:green }\n</style>`;

// test('Class directives from imports', async () => {
//   const source =
//   `<script>
//     import css from './importFixtures/module.css';
//   </script>
//   <div class:css.error={true}>Error</div>`;

//   const expected =
//   `<script>
//     const css = {"error":"error-123","success":"success-123"};
//   </script>
//   <div class:error-123={true}>Error</div>\n${style}`;

//   const output = await compiler(
//     { source },
//     { localIdentName: '[local]-123' }
//   );

//   expect(output).toBe(expected);
// });

// test('Class directives from destructuring imports', async () => {
//   const source =
//   `<script>
//     import { error, success } from './importFixtures/module.css';
//   </script>
//   <div class:error={false} class:success={true}>Message</div>
//   <div class:success={true}>Success</div>`;

//   const expected =
//   `<script>
//     const { error, success } = {"error":"error-123","success":"success-123"};
//   </script>
//   <div class:error-123={false} class:success-123={true}>Message</div>
//   <div class:success-123={true}>Success</div>\n${style}`;

//   const output = await compiler(
//     { source },
//     { localIdentName: '[local]-123' }
//   );

//   expect(output).toBe(expected);
// });
