# Svelte preprocess CSS Modules

Generate CSS Modules classname on Svelte components

```bash
npm install --save-dev svelte-preprocess-cssmodules
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

### Options
Pass an object of the following properties

| Name | Type | Default | Description |
| ------------- | ------------- | ------------- | ------------- |
| `localIdentName` | `{String}` | `"[local]-[hash:base64:6]"` |  A rule using any available token |
| `includePaths` | `{Array}` | `[]` (Any) | An array of paths to be processed |
| `getLocalIdent` | `Function` | `undefined`  | Generate the classname by specifying a function instead of using the built-in interpolation |
| `strict`  | `{Boolean}` | `false` | When true, an exception is raised when a class is used while not being defined in `<style>`
   

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
<button class="$style.red">Ok</button>

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

## Usage on Svelte Component

**On the HTML markup** (not the CSS), Prefix any class name that require CSS Modules by *$style.*  => `$style.MY_CLASSNAME`

```html
<style>
  .red { color: red; }
</style>

<p class="$style.red">My red text</p>
```

The component will be transformed to

```html
<style>
  .red-30_1IC { color: red; }
</style>

<p class="red-30_1IC">My red text</p>
```

### Replace only the required class

CSS Modules classname are generated to the html class values prefixed by `$style.`. The rest is left untouched and will use the default svelte scoped class.

*Before*

```html
<style>
  .blue { color: blue; }
  .red { color: red; }
  .text-center { text-align: center; }
</style>

<p class="blue text-center">My blue text</p>
<p class="$style.red text-center">My red text</p>
```

*After*

```html
<style>
  .blue.svelte-1s2ez3w { color: blue;}
  .red-2iBDzf { color: red; }
  .text-center.svelte-1s2ez3w { text-align: center; }
</style>

<p class="blue text-center svelte-1s2ez3w">My blue text</p>
<p class="red-2iBDzf text-center svelte-1s2ez3w">My red text</p>
```

### Remove unspecified class

On non strict mode, if a CSS Modules class has no css style attached, it will be removed from the class attribute.

*Before*

```html
<style>
  .text-center { text-align: center; }
</style>

<p class="$style.blue text-center">My blue text</p>
```

*After*

```html
<style>
  .text-center.svelte-1s2ez3w { text-align: center; }
</style>

<p class="text-center svelte-1s2ez3w">My blue text</p>
```

### Target any classname format

kebab-case or camelCase, name the classes the way you're more comfortable with.

*Before*

```html
<style>
  .red { color: red; }
  .red-crimson { color: crimson; }
  .redMajenta { color: magenta; }
</style>

<span class="$style.red">Red</span>
<span class="$style.red-crimson">Crimson</span>
<span class="$style.redMajenta">Majenta</span>
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

### Use class multiple times
A class can be naturally used on multiple elements.

*Before*

```html
<style>
  .red { color: red; }
  .blue { color: blue; }
  .bold { font-weight: bold; }
</style>

<p class="$style.red $style.bold">My red text</p>
<p class="$style.blue $style.bold">My blue text</p>
```

*After*

```html
<style>
  .red-en-6pb { color: red; }
  .blue-oVk-n1 { color: blue; }
  .bold-2jIMhI { font-weight: bold; }
</style>

<p class="red-en-6pb bold-2jIMhI">My red text</p>
<p class="blue-oVk-n1 bold-2jIMhI">My blue text</p>
```

### Work with class directives
Toggling a class on an element.

```html
<script>
  let isActive = true;
</script>

<style>
  .bold { font-weight: bold; }
</style>

<p class:$style.bold={isActive}>My red text</p>
<p class="{isActive ? '$style.bold' : ''}">My blue text</p>
```

### Shorthand
To remove verbosity the shorthand `$.MY_CLASSNAME` can be used instead of the regular `$style.MY_CLASSNAME`.

*before*

```html
<script>
  let isActive = true;
</script>

<style>
  .red { color: red; }
  .blue { color: blue; }
  .bold { font-weight: bold; }
</style>

<p
  class:$.bold={isActive}
  class="$.red">My red text</p>
<p class="{isActive ? '$.bold' : ''} $.blue">My blue text</p>
```

*After*

```html
<style>
  .red-en-6pb { color: red; }
  .blue-oVk-n1 { color: blue; }
  .bold-2jIMhI { font-weight: bold; }
</style>

<p class="red-en-6pb bold-2jIMhI">My red text</p>
<p class="bold-2jIMhI blue-oVk-n1">My blue text</p>
```

## Import external stylesheet

Alternatively, styles can be created into an external file and imported onto the svelte component within the `script` tag. The  name referring to the import can then be used in the markup targetting any existing classname of the stylesheet. 

```css
/** style.css **/
.red { color: red; }
.blue { color: blue; }
```
```html
<!-- Svelte component -->
<script>
  import style from './style.css';
</script>

<p class={style.red}>My red text</p>
<p class={style.blue}>My blue text</p>
```
Generating your svelte component into

```html
<style>
  .red-en-6pb { color: red; }
  .blue-oVk-n1 { color: blue; }
</style>

<p class="red-en-6pb">My red text</p>
<p class="blue-oVk-n1">My blue text</p>
```

### Svelte scoped system on non class selectors
All existing rules inside the stylesheet will be applied to the component the way `<style>` would do. All non class selectors will inherit the default svelte scoped system.

```css
/** style.css **/
.red { color: red; }
section { padding: 10px; }
p > strong { font-weight: 600; }
```
```html
<!-- Svelte component -->
<script>
  import style from './style.css';
</script>

<section>
  <p class={style.red}>My <strong>red</strong> text</p>
  <p>My <strong>blue</strong> text</p>
</section>
```

*Generated code*

```html
<style>
  .red-1sPexk { color: red; }
  section.svelte-18te3n2 { padding: 10px; }
  p.svelte-18te3n2 > strong.svelte-18te3n2 { font-weight: 600; }
</style>

<section class="svelte-18te3n2">
  <p class="red-1sPexk svelte-18te3n2">My <strong class="svelte-18te3n2">red</strong> text</p>
  <p class="svelte-18te3n2">My <strong class="svelte-18te3n2">blue</strong> text</p>
</section>
```

### Destructuring import
Only import the classname you want to use as css modules. The rest 

## Example

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

*Svelte Component*

```html
<style>
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

<div class="$style.modal">
  <section>
    <header>My Modal Title</header>
    <div class="$style.body">
      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
    </div>
    <footer>
      <button>Ok</button>
      <button class="$style.cancel">Cancel</button>
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
  section.svelte-1s2ez3w {
    flex: 0 1 auto;
    flex-direction: column;
    display: flex;
    height: 100%;
  }
  header.svelte-1s2ez3w {
    padding: 1rem;
    border-bottom: 1px solid #d9d9d9;
  }
  ._1HPUBXtzNG {
    padding: 1rem;
    flex: 1 0 0;
  }
  footer.svelte-1s2ez3w {
    padding: 1rem;
    border-top: 1px solid #d9d9d9;
  }
  button.svelte-1s2ez3w {
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  ._1xhJxRwWs7 {
    background-color: #f2f2f2;
  }
</style>

<div class="_329TyLUs9c">
  <section class="svelte-1s2ez3w">
    <header class="svelte-1s2ez3w">My Modal Title</header>
    <div class="_1HPUBXtzNG">
      <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
    </div>
    <footer class="svelte-1s2ez3w">
      <button class="svelte-1s2ez3w">Ok</button>
      <button class="_1xhJxRwWs7 svelte-1s2ez3w">Cancel</button>
    </footer>
  </section>
</div>
```

**Note:** The svelte scoped class is still being applied to the html elements with a style.

## Why CSS Modules on Svelte

While the native CSS Scoped system should be largely enough to avoid class conflict, it could find its limit when working on a hybrid project. On a non full Svelte application, the thought on the class naming would not be less different than what we would do on a regular html page. For example, on the modal component above, It would have been wiser to namespace some of the classes such as `.modal-body` and `.modal-cancel` in order to prevent inheriting styles from other `.body` and `.cancel` classes.

## License

[MIT](https://opensource.org/licenses/MIT)