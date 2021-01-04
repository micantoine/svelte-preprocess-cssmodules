# Svelte preprocess CSS Modules, changelog

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