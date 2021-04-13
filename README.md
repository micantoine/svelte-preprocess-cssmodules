# Svelte preprocess CSS Modules

Generate CSS Modules classname on Svelte components

```bash
npm install --save-dev svelte-preprocess-cssmodules
```

- [Usage](#usage)
  - [Modes](#modes)
  - [Target any classname format](#target-any-classname-format)
  - [Work with class directive](#work-with-class-directive)
- [Import styles from an external stylesheet](#import-styles-from-an-external-stylesheet)
  - [Destructuring import](#destructuring-import)
  - [kebab-case situation](#kebab-case-situation)
  - [Unnamed import](#unnamed-import)
  - [Directive and dynamic class](#directive-and-dynamic-class)
- [Configuration](#configuration)
  - [Rollup](#rollup)
  - [Webpack](#webpack)
  - [Options](#options)
- [Code example](#code-example)
- [Why CSS Modules on Svelte](#why-css-modules-on-svelte)

## Usage

Add `module` attribute to the `<style>` tag to enable cssModules in the component.

```html
<style module>
  p { font-size: 14px; }
  .red { color: red; }
</style>

<p class="red">My red text</p>
```

The component will be transformed to

```html
<style>
  p { font-size: 14px; }
  .red-30_1IC { color: red; }
</style>

<p class="red-30_1IC">My red text</p>
```

### Modes

Preprocessor can operate in the following modes:

- `native` (default) - scopes classes with cssModules, anything else is unscoped
- `mixed` - scopes non-class selectors with svelte scoping in addition to `native` (same as preprocessor `v1`)
- `scoped` - scopes classes with svelte scoping in addition to `mixed`

The mode can be set globally from the preprocessor options or locally to override the global settings per component.

*Mixed mode*
```html
<style module="mixed">
  p { font-size: 14px; }
  .red { color: red; }
</style>

<p class="red">My red text</p>
```

*generating*

```html
<style>
  p.svelte-teyu13r { font-size: 14px; }
  .red-30_1IC { color: red; }
</style>

<p class="red-30_1IC svelte-teyu13r">My red text</p>
```

*Scoped mode*
```html
<style module="scoped">
  p { font-size: 14px; }
  .red { color: red; }
</style>

<p class="red">My red text</p>
```

*generating*

```html
<style>
  p.svelte-teyu13r { font-size: 14px; }
  .red-30_1IC.svelte-teyu13r { color: red; }
</style>

<p class="red-30_1IC svelte-teyu13r">My red text</p>
```

### Target any classname format

kebab-case or camelCase, name the classes the way you're more comfortable with.

*Before*

```html
<style module>
  .red { color: red; }
  .red-crimson { color: crimson; }
  .redMajenta { color: magenta; }
</style>

<span class="red">Red</span>
<span class="red-crimson">Crimson</span>
<span class="redMajenta">Majenta</span>
```

*After*

```html
<style>
  .red-2xTdmA { color: red; }
  .red-crimson-1lu8Sg { color: crimson; }
  .redMajenta-2wdRa3 { color: magenta; }
</style>

<span class="red-2xTdmA">Red</span>
<span class="red-crimson-1lu8Sg">Crimson</span>
<span class="redMajenta-2wdRa3">Majenta</span>
```

### Work with class directive

Toggle a class on an element.

```html
<script module>
  let isActive = true;
</script>

<style>
  .bold { font-weight: bold; }
</style>

<p class:bold={isActive}>My red text</p>
<p class="{isActive ? 'bold' : ''}">My blue text</p>
```

*After*

```html
<style>
  .bold-2jIMhI { font-weight: bold; }
</style>

<p class="bold-2jIMhI">My red text</p>
<p class="bold-2jIMhI">My blue text</p>
```

## Import styles from an external stylesheet

Alternatively, styles can be created into an external file and imported onto a svelte component from the `<script>` tag. The  name referring to the import can then be used in the markup targetting any existing classname of the stylesheet.

The css file must follow the convention `FILENAME.module.css` in order to be processed.

**Note:** *The import option is only meant for stylesheets relative to the component. You will have to set your own bundler in order to import *node_modules* packages css files.*

```css
/** style.module.css **/
.red { color: red; }
.blue { color: blue; }
```
```html
<!-- Svelte component -->
<script>
  import style from './style.module.css';
</script>

<p class={style.red}>My red text</p>
<p class={style.blue}>My blue text</p>
```

*Generated code*

```html
<style>
  .red-en-6pb { color: red; }
  .blue-oVk-n1 { color: blue; }
</style>

<p class="red-en-6pb">My red text</p>
<p class="blue-oVk-n1">My blue text</p>
```

### Destructuring import

```css
/** style.module.css **/
section { padding: 10px; }
.red { color: red; }
.blue { color: blue; }
.bold { font-weight: bold; }
```
```html
<!-- Svelte component -->
<script>
  import { red, blue } from './style.module.css';
</script>

<section>
  <p class={red}>My <span class="bold">red</span> text</p>
  <p class="{blue} bold">My blue text</p>
</section>
```

*Generated code*

```html
<style>
  section { padding: 10px; }
  .red-1sPexk { color: red; }
  .blue-oVkn13 { color: blue; }
  .bold-18te3n { font-weight: bold; }
</style>

<section>
  <p class="red-1sPexk">My <span class="bold-18te3n">red</span> text</p>
  <p class="blue-oVkn13 bold-18te3n">My blue text</p>
</section>
```

### kebab-case situation

The kebab-case classnames are being transformed to a camelCase version on imports to facilitate their use on Markup and Javascript.

```css
/** style.module.css **/
.success { color: green; }
.error-message {
  color: red;
  text-decoration: line-through;
}
```
```html
<script>
  import css from './style.module.css';
</script>

<p class={css.success}>My success text</p>
<p class="{css.errorMessage}">My error message</p>

<!-- OR -->

<script>
  import { success, errorMessage } from './style.module.css';
</script>

<p class={success}>My success message</p>
<p class={errorMessage}>My error message</p>
```

*Generated code*

```html
<style>
  .success-3BIYsG { color: green; }
  .error-message-16LSOn {
    color: red;
    text-decoration: line-through;
  }
</style>

<p class="success-3BIYsG">My success messge</p>
<p class="error-message-16LSOn">My error message</p>
```

### Unnamed import

If a css file is being imported without a name, the cssModules will still be applied to the classes of the stylesheet.

```css
/** style.module.css **/
p { font-size: 18px; }
.success { color: green; }
```
```html
<script>
  import './style.module.css'
</script>

<p class="success">My success message</p>
<p>My another message</p>
```

*Generated code*

```html
<style>
  p { font-size: 18px; }
  .success-vg78j0 { color: green; }
</style>

<p class="success-vg78j0">My success messge</p>
<p>My error message</p>
```

### Directive and Dynamic class

Use the Svelte's builtin `class:` directive or javascript template to display a class dynamically.  
**Note**: the *shorthand directive* is **NOT working** with CSS Modules.

```html
<script>
  import { success, error } from './style.module.css';

  let isSuccess = true;
  $: notice = isSuccess ? success : error;
</script>

<button on:click={() => isSuccess = !isSuccess}>Toggle</button>

<!-- Error -->
<p class:success>Success</p>

<!-- Ok -->
<p 
  class:success={isSuccess}
  class:error={!isSuccess}>Notice</p>

<p class={notice}>Notice</p>
<p class={isSuccess ? success : error}>Notice</p>
```

## Configuration

### Rollup

To be used with the plugin [`rollup-plugin-svelte`](https://github.com/sveltejs/rollup-plugin-svelte).

```js
import svelte from 'rollup-plugin-svelte';
import cssModules from 'svelte-preprocess-cssmodules';

export default {
  ...
  plugins: [
    svelte({
      preprocess: [
        cssModules(),
      ]
    }),
  ]
  ...
}
```

### Webpack

To be used with the loader [`svelte-loader`](https://github.com/sveltejs/svelte-loader).

```js
const cssModules = require('svelte-preprocess-cssmodules');

module.exports = {
  ...
  module: {
    rules: [
      {
        test: /\.svelte$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'svelte-loader',
            options: {
              preprocess: [
                cssModules(),
              ]
            }
          }
        ]
      }
    ]
  }
  ...
}
```

### Svelte Preprocess

```bash
npm install --save-dev svelte-as-markup-preprocessor
```

```js
const asMarkupPreprocessor = require('svelte-as-markup-preprocessor');

...
              preprocess: [
                asMarkupPreprocessor([
                  sveltePreprocess()
                ]),
                cssModules()
              ],
...
```

Explanation on why svelte-as-markup-preprocessor is needed: [read here](https://github.com/firefish5000/svelte-as-markup-preprocessor#motivation):

### Options
Pass an object of the following properties

| Name | Type | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| `localIdentName` | `{String}` | `"[local]-[hash:base64:6]"` |  A rule using any available token |
| `includePaths` | `{Array}` | `[]` (Any) | An array of paths to be processed |
| `getLocalIdent` | `Function` | `undefined`  | Generate the classname by specifying a function instead of using the built-in interpolation |
| `mode`  | `native\|mixed\|scoped` | `native` | The preprocess mode to use

**`localIdentName`**

Inspired by [webpack interpolateName](https://github.com/webpack/loader-utils#interpolatename), here is the list of tokens:

- `[local]` the targeted classname
- `[ext]` the extension of the resource
- `[name]` the basename of the resource
- `[path]` the path of the resource
- `[folder]` the folder the resource is in
- `[contenthash]` or `[hash]` *(they are the same)* the hash of the resource content (by default it's the hex digest of the md4 hash)
- `[<hashType>:contenthash:<digestType>:<length>]` optionally one can configure
  - other hashTypes, i. e. `sha1`, `md4`, `md5`, `sha256`, `sha512`
  - other digestTypes, i. e. `hex`, `base26`, `base32`, `base36`, `base49`, `base52`, `base58`, `base62`, `base64`
  - and `length` the length in chars

**`getLocalIdent`**

Customize the creation of the classname instead of relying on the built-in function.

```ts
function getLocalIdent(
  context: {
    context: string, // the context path
    resourcePath: string, // path + filename
  },
  localIdentName: {
    template: string, // the template rule
    interpolatedName: string, // the built-in generated classname
  },
  className: string, // the classname string
  content: { 
    markup: string, // the markup content
    style: string,  // the style content
  }
): string {
  return `your_generated_classname`;
}
```

*Example of use*

```bash
# Directory
SvelteApp
└─ src
   ├─ App.svelte
   └─ components
      └─ Button.svelte
```
```html
<!-- Button.svelte -->
<button class="red">Ok</button>

<style>
  .red { background-color: red; }
</style>
```

```js
// Preprocess config
...
preprocess: [
  cssModules({
    localIdentName: '[path][name]__[local]',
    getLocalIdent: (context, { interpolatedName }) => {
      return interpolatedName.toLowerCase().replace('src_', '');
      // svelteapp_components_button__red;
    }
  })
],
...
```

## Code Example

*Rollup Config*

```js
export default {
  ...
  plugins: [
    svelte({
      preprocess: [
        cssModules({
          includePaths: ['src'],
          localIdentName: '[hash:base64:10]',
        }),
      ]
    }),
  ]
  ...
}
```

*Svelte Component using `<style>`*

```html
<style module>
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 10;
    width: 400px;
    height: 80%;
    background-color: #fff;
    transform: translateX(-50%) translateY(-50%);
  }
  section {
    flex: 0 1 auto;
    flex-direction: column;
    display: flex;
    height: 100%;
  }
  header {
    padding: 1rem;
    border-bottom: 1px solid #d9d9d9;
  }
  .body {
    padding: 1rem;
    flex: 1 0 0;
  }
  footer {
    padding: 1rem;
    border-top: 1px solid #d9d9d9;
  }
  button {
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  .cancel {
    background-color: #f2f2f2;
  }
</style>

<div class="modal">
  <section>
    <header>My Modal Title</header>
    <div class="body">
      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
    </div>
    <footer>
      <button>Ok</button>
      <button class="cancel">Cancel</button>
    </footer>
  </section>
</div>
```

***OR** Svelte Component using `import`*

```css
/** style.module.css */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 10;
  width: 400px;
  height: 80%;
  background-color: #fff;
  transform: translateX(-50%) translateY(-50%);
}

[...]
```
```html
<script>
  import style from './style.module.css';
</script>

<div class={style.modal}>
  <section>
    <header>My Modal Title</header>
    <div class={style.body}>
      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
    </div>
    <footer>
      <button>Ok</button>
      <button class={style.cancel}>Cancel</button>
    </footer>
  </section>
</div>
```

*Final html code generated by svelte*

```html
<style>
  ._329TyLUs9c {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 10;
    width: 400px;
    height: 80%;
    background-color: #fff;
    transform: translateX(-50%) translateY(-50%);
  }
  section {
    flex: 0 1 auto;
    flex-direction: column;
    display: flex;
    height: 100%;
  }
  header {
    padding: 1rem;
    border-bottom: 1px solid #d9d9d9;
  }
  ._1HPUBXtzNG {
    padding: 1rem;
    flex: 1 0 0;
  }
  footer {
    padding: 1rem;
    border-top: 1px solid #d9d9d9;
  }
  button {
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  ._1xhJxRwWs7 {
    background-color: #f2f2f2;
  }
</style>

<div class="_329TyLUs9c">
  <section>
    <header>My Modal Title</header>
    <div class="_1HPUBXtzNG">
      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
    </div>
    <footer>
      <button>Ok</button>
      <button class="_1xhJxRwWs7">Cancel</button>
    </footer>
  </section>
</div>
```

## Why CSS Modules on Svelte

While the native CSS Scoped system should be largely enough to avoid class conflict, it could find its limit when working on a hybrid project. On a non full Svelte application, the thought on the class naming would not be less different than what we would do on a regular html page. For example, on the modal component above, It would have been wiser to namespace some of the classes such as `.modal-body` and `.modal-cancel` in order to prevent inheriting styles from other `.body` and `.cancel` classes.

## License

[MIT](https://opensource.org/licenses/MIT)
