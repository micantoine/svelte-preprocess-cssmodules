import path from 'path';
import {
  generateName,
  getLocalIdent,
  GetLocalIdent,
  Patterns
} from './utils';

type PluginOptions = {
  includePaths: string[];
  localIdentName: string;
  getLocalIdent: GetLocalIdent;
  strict: boolean;
}

const pluginOptions: PluginOptions = {
  includePaths: [],
  localIdentName: '[local]-[hash:base64:6]',
  getLocalIdent,
  strict: false
};

const moduleClasses: Record<string, Record<string, string>> = {};

interface IPreprocessorOptions {
  content: string;
  filename: string;
}

interface IPreprocessorResult {
  code: string;
}

const markup = async (
  { content, filename }: IPreprocessorOptions
): Promise<IPreprocessorResult> => {
  const code = content;

  if (pluginOptions.includePaths.length) {
    let isExcluded = false;
    pluginOptions.includePaths.forEach((includePath) => {
      if (filename.indexOf(path.resolve(includePath)) === -1) {
        isExcluded = true;
      }
    });

    if (isExcluded) {
      return { code };
    }
  }

  if (!Patterns.PATTERN_MODULE.test(content)) {
    return { code };
  }

  const styles = content.match(Patterns.PATTERN_STYLE);
  moduleClasses[filename] = {};

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
            markup: code,
            style: styles[0]
          }
        );

        moduleClasses[filename][className] = customInterpolatedName;
        replacement = customInterpolatedName;
      }
      return replacement;
    })
  };
};

const style = async ({ content, filename }) => {
  let code = content;

  if (!moduleClasses.hasOwnProperty(filename)) {
    return { code };
  }

  const classes = moduleClasses[filename];

  if (Object.keys(classes).length === 0) {
    return { code };
  }

  for (const className in classes) {
    code = code.replace(
      Patterns.PATTERN_CLASS_SELECTOR(className),
      (match) => {
        const generatedClass = match.replace(
          Patterns.PATTERN_CLASSNAME(className),
          () => `.${classes[className]}`
        );

        return generatedClass.indexOf(':global(') !== -1
          ? generatedClass
          : `:global(${generatedClass})`;
      }
    );
  }

  return { code };
};

module.exports = (options) => {
  for (const option in options) {
    pluginOptions[option] = options[option];
  }
  return {
    markup,
    style
  };
};
