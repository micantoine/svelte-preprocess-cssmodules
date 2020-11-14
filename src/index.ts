import path from 'path';
import { PluginOptions, PreprocessorOptions, PreprocessorResult } from './types';
import {
  generateName,
  getLocalIdent,
  Patterns
} from './utils';


let pluginOptions: PluginOptions = {
  includePaths: [],
  localIdentName: '[local]-[hash:base64:6]',
  getLocalIdent,
  strict: false
};

const moduleClasslist: Record<string, Record<string, string>> = {};

const markup = async (
  { content, filename }: PreprocessorOptions
): Promise<PreprocessorResult> => {
  if (pluginOptions.includePaths.length) {
    let isExcluded = false;
    pluginOptions.includePaths.forEach((includePath) => {
      if (filename.indexOf(path.resolve(includePath)) === -1) {
        isExcluded = true;
      }
    });

    if (isExcluded) {
      return { code: content };
    }
  }

  if (!Patterns.PATTERN_MODULE.test(content)) {
    return { code: content };
  }

  const styles = content.match(Patterns.PATTERN_STYLE);
  moduleClasslist[filename] = {};

  return {
    code: content.replace(Patterns.PATTERN_MODULE, (match, key, className) => {
      let replacement = '';
      if (!className.length) {
        throw new Error(
          `Invalid class name in file ${filename}.\n`
          + 'This usually happens when using dynamic classes with svelte-preprocess-cssmodules.'
        );
      }

      if (!Patterns.PATTERN_CLASSNAME(className).test(`.${className}`)) {
        throw new Error(`Classname "${className}" in file ${filename} is not valid`);
      }

      if (styles.length) {
        if (!Patterns.PATTERN_CLASSNAME(className).test(styles[0])) {
          if (pluginOptions.strict) {
            throw new Error(
              `Classname "${className}" was not found in declared ${filename} <style>`
            );
          } else {
            // In non-strict mode, we just remove $style classes that don't have a definition
            return '';
          }
        }

        const interpolatedName = generateName(
          filename, styles[0], className, pluginOptions.localIdentName
        );

        const customInterpolatedName = pluginOptions.getLocalIdent(
          {
            context: path.dirname(filename),
            resourcePath: filename
          },
          {
            interpolatedName,
            template: pluginOptions.localIdentName
          },
          className,
          {
            markup: content,
            style: styles[0]
          }
        );

        moduleClasslist[filename][className] = customInterpolatedName;
        replacement = customInterpolatedName;
      }
      return replacement;
    })
  };
};

const style = async (
  { content, filename }: PreprocessorOptions
): Promise<PreprocessorResult> => {
  if (!Object.prototype.hasOwnProperty.call(moduleClasslist, filename)) {
    return { code: content };
  }

  const moduleClass = moduleClasslist[filename];

  if (Object.keys(moduleClass).length === 0) {
    return { code: content };
  }

  let updatedContent = content;

  Object.keys(moduleClass).forEach((className) => {
    updatedContent = updatedContent.replace(
      Patterns.PATTERN_CLASS_SELECTOR(className),
      (match) => {
        const generatedClass = match.replace(
          Patterns.PATTERN_CLASSNAME(className),
          () => `.${moduleClass[className]}`
        );

        return generatedClass.indexOf(':global(') !== -1
          ? generatedClass
          : `:global(${generatedClass})`;
      }
    );
  });

  return { code: updatedContent };
};

// eslint-disable-next-line no-multi-assign
export default exports = module.exports = (options: Partial<PluginOptions>) => {
  pluginOptions = {
    ...pluginOptions,
    ...options
  };
  return {
    markup,
    style
  };
};
