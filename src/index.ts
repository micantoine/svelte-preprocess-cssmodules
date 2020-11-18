import {
  PluginOptions,
  PreprocessorOptions,
  PreprocessorResult,
  CSSModuleDirectory,
} from './types';
import { parseMarkup, parseStyle } from './processors';
import { getLocalIdent, isFileIncluded, PATTERN_IMPORT, PATTERN_MODULE } from './lib';

let pluginOptions: PluginOptions = {
  includePaths: [],
  localIdentName: '[local]-[hash:base64:6]',
  getLocalIdent,
  strict: false,
};

const cssModuleDirectory: CSSModuleDirectory = {};

const markup = async ({ content, filename }: PreprocessorOptions): Promise<PreprocessorResult> => {
  const isIncluded = await isFileIncluded(pluginOptions.includePaths, filename);

  if (!isIncluded) {
    return { code: content };
  }

  if (!PATTERN_MODULE.test(content) && !PATTERN_IMPORT.test(content)) {
    return { code: content };
  }

  const parsedMarkup = parseMarkup(content, filename, pluginOptions);
  cssModuleDirectory[filename] = parsedMarkup.cssModuleList;

  return {
    code: parsedMarkup.content,
  };
};

const style = async ({ content, filename }: PreprocessorOptions): Promise<PreprocessorResult> => {
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
    ...options,
  };

  return {
    markup,
    style,
  };
};
