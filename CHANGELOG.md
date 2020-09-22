# Svelte preprocess CSS Modules, changelog

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