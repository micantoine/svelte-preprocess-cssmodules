import path from 'path';
import {
  PluginOptions,
  PreprocessorOptions,
  PreprocessorResult,
  CSSModuleDirectory
} from './types';
import { parseMarkup, parseStyle } from './processors';
import { getLocalIdent, PATTERN_MODULE } from './lib';

let pluginOptions: PluginOptions = {
  includePaths: [],
  localIdentName: '[local]-[hash:base64:6]',
  getLocalIdent,
  strict: false
};

const cssModuleDirectory: CSSModuleDirectory = {};

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

  if (!PATTERN_MODULE.test(content)) {
    return { code: content };
  }

  const parsedMarkup = parseMarkup(content, filename, pluginOptions);
  cssModuleDirectory[filename] = parsedMarkup.cssModuleList;

  return { code: parsedMarkup.content };
};

const style = async (
  { content, filename }: PreprocessorOptions
): Promise<PreprocessorResult> => {
  if (!Object.prototype.hasOwnProperty.call(cssModuleDirectory, filename)) {
    return { code: content };
  }

  const parsedStyle = parseStyle(content, filename, cssModuleDirectory[filename]);

  return { code: parsedStyle.content };
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
