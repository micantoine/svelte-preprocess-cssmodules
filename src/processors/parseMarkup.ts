import path from 'path';
import { PluginOptions, CSSModuleList } from '../types';
import { PATTERN_MODULE, PATTERN_CLASSNAME, PATTERN_STYLE } from '../lib/patterns';
import generateName from '../lib/generateName';

export type Parser = {
  content: string;
  cssModuleList: CSSModuleList;
};

const parseMarkup = (content: string, filename: string, pluginOptions: PluginOptions): Parser => {
  const styles = content.match(PATTERN_STYLE);
  const styleContent = styles.length ? styles[0] : null;

  const cssModuleList: CSSModuleList = {};

  const parsedContent = content.replace(PATTERN_MODULE, (match, key, className) => {
    let replacement = '';
    if (!className.length) {
      throw new Error(
        `Invalid class name in file ${filename}.\n` +
          'This usually happens when using dynamic classes with svelte-preprocess-cssmodules.'
      );
    }

    if (!PATTERN_CLASSNAME(className).test(`.${className}`)) {
      throw new Error(`Classname "${className}" in file ${filename} is not valid`);
    }

    if (!PATTERN_CLASSNAME(className).test(styleContent)) {
      if (pluginOptions.strict) {
        throw new Error(`Classname "${className}" was not found in declared ${filename} <style>`);
      }
      // In non-strict mode, we just remove $style classes that don't have a definition
      return replacement;
    }

    if (styleContent) {
      const interpolatedName = generateName(
        filename,
        styleContent,
        className,
        pluginOptions.localIdentName
      );

      const customInterpolatedName = pluginOptions.getLocalIdent(
        {
          context: path.dirname(filename),
          resourcePath: filename,
        },
        {
          interpolatedName,
          template: pluginOptions.localIdentName,
        },
        className,
        {
          markup: content,
          style: styleContent,
        }
      );

      cssModuleList[className] = customInterpolatedName;
      replacement = customInterpolatedName;
    }

    return replacement;
  });

  return {
    content: parsedContent,
    cssModuleList,
  };
};

export default parseMarkup;
