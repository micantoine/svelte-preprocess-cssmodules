# Svelte preprocess CSS Modules, changelog

## 3.0.0 (Jan 17 2025)

### Update

- Support for svelte 5 [#124](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/124)
- Use modern AST

### Breaking Changes
- Remove `linearPreprocess` util since it is not being needed anymore
- Set peer dependencies to svelte 5 only

## 2.2.5 (Sept 19, 2024)

### Updates

- Replace deprecated method by use of `walk()` from `estree-walker` [#100](https://github.com/micantoine/svelte-preprocess-cssmodules/pull/100)
- Upgrade dev dependencies
- Add svelte 4 to peer dependencies

### Fixes

- Make `cssModules()` parameter optional [#94](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/94)
- Remove typescript from peer dependencies (not needed, keep in dev dependencies) [#93](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/93)
- Properly transform `animation-name` [#98](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/98)

## 2.2.4 (Jan 20, 2022)

### Fixes

- Syntax error on keyframes for native mode [issue 84](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/84)
- Prevent svelte to remove the keyframes rule if no html tag exist [issue 76](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/76)

## 2.2.3 (June 21, 2022)

### Fixes

- Add support for css binding on svelte blocks `{#if}` `{#each}` `{#await}` `{#key}` [issue 62](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/62)

## 2.2.2 (June 21, 2022)

### Fixes

- Set default hash method to `md5` to support node17+ [issue 60](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/60)

## 2.2.1 (May 26, 2022)

### Fixes

- Destructuring import with commonjs
- Emphasize on named imports instead of default

## 2.2.0 (Apr 6, 2022)

### Features
- CSS Binding
- Linear preprocess utility

### Updates
- More detailed Readme

## 2.1.3 (Mar 14, 2022)

### Fixes
- Normalise `includePaths` [issue 42](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/42)
- Readme typos

### Updates
- Dependencies

## 2.1.2 (Jan 8, 2022)

- Fix multiline class attribute [issue 39](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/39)

## 2.1.1 (Oct 27, 2021)

- Fix readme

## 2.1.0 (Oct 20, 2021)
### Features
- SvelteKit support
- `useAsDefaultScoping` option
- `parseExternalStylesheet` option

### Breaking changes
- Rename option `allowedAttributes` to  `includeAttributes`
- External cssModules stylesheets are not being processed automatically.

## 2.1.0-rc.2 (Oct 7, 2021)
### Features
- Add option `useAsDefaultScoping` to enable cssModules globally without the need of the `module` attribute

### Breaking changes
- Rename option `allowedAttributes` to  `includeAttributes`
- Add option `parseExternalStylesheet` to manually enable the parsing of imported stylesheets *(no more enabled by default)*

## 2.1.0-rc.1 (Oct 6, 2021)
- Add ESM distribution

## 2.0.2 (May 26, 2021)
- Fix Readme

## 2.0.1 (May 6, 2021)
- Fix shorthand directive breaking regular directive

## 2.0.0 (May 1, 2021)
New public release

## 2.0.0-rc.3 (April 20, 2021)

### Features
- Add `:local()` selector
### Fixes
- Fix native parsing

## 2.0.0-rc.2 (April 16, 2021)

### Features
- Add option `hashSeeder` to customize the source of the hashing method
- Add option `allowedAttributes` to parse other attributes than `class`
### Fixes
- Replace `class` attribute on HTML elements and inline components
- Fix external import on `native` & `mixed` mode when `<style>` already exists
- Shorthand directive

## 2.0.0-rc.1 (April 11, 2021)

New main release of the preprocessor including

- Drop of the prefixes `$style.` & `$.` [issue #13](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/13)
- Introduction of three mode `native`, `mixed`, `scoped` (default being `native` following cssModules philosophy)
- Requirement of the `module` attribute on the `<style>` tag to preprocess the component
- Option to locally change the preprocessing mode per component by setting a value to the `module` attribute
- External stylesheets' imports following the convention `.module.css`
- No more IDE unused CSS selector warning [issue #5](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/5)

## 1.3.2 (Jan 4, 2021)
Fix attempting import from `node_modules` packages [issue #10](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/10) - [pull request #11](https://github.com/micantoine/svelte-preprocess-cssmodules/pull/11)

## 1.3.1 (Nov 22, 2020)
Add support for old version of nodes (node 8 & node 10 tested)

## 1.3.0 (Nov 22, 2020)

### Feature
Apply CSS Modules from imported stylesheets

### Fixes
*global selector* Regex is now working with an attached bracket to the selector (missing space was throwing an error) `.myclass{ }`

### Plugin Development
Set up typescript, eslint and prettier

## 1.2.1 (Oct 31, 2020)
- Fix class chaining and pseudo selector [pull request #8](https://github.com/micantoine/svelte-preprocess-cssmodules/pull/8)

## 1.2.0 (Sept 21, 2020)
- Add support for `getLocalIdent()` [issue #6](https://github.com/micantoine/svelte-preprocess-cssmodules/issues/6) - [pull request #7](https://github.com/micantoine/svelte-preprocess-cssmodules/pull/7)

## 1.1.1
- Fix the use of `[path]` in the `localIdentName` rule.
- Escape css on the classname
- Dependencies update

## 1.1.0
- Add optional shortand syntax `$.MY_CLASSNAME` to increase development speed and remove verbosity.

## 1.0.1
- Fix style parsing on empty cssModules class

## 1.0.0 
- Ability to use the same class on multiple elments
- Use with svelte loader Ok
- Add test

## 0.1.1
- Fix modules exports
- Fix `includePaths` check
- Update `loader-utils` package

## 0.1.0
- Initial commit