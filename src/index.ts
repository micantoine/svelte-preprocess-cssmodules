/* eslint-disable no-multi-assign */
import { parse, preprocess } from 'svelte/compiler';
import type { Ast } from 'svelte/types/compiler/interfaces';
import type { PreprocessorGroup, MarkupPreprocessor } from 'svelte/types/compiler/preprocess';
import type { PluginOptions } from './types';
import { nativeProcessor, mixedProcessor, scopedProcessor } from './processors';
import {
  getLocalIdent,
  isFileIncluded,
  hasModuleImports,
  hasModuleAttribute,
  normalizeIncludePaths,
} from './lib';

const defaultOptions = (): PluginOptions => {
  return {
    cssVariableHash: '[hash:base64:6]',
    getLocalIdent,
    hashSeeder: ['style', 'filepath', 'classname'],
    includeAttributes: [],
    includePaths: [],
    localIdentName: '[local]-[hash:base64:6]',
    mode: 'native',
    parseExternalStylesheet: false,
    parseStyleTag: true,
    useAsDefaultScoping: false,
  };
};

let pluginOptions: PluginOptions;

/**
 * cssModules markup phase
 * @param param0
 * @returns the preprocessor markup
 */
const markup: MarkupPreprocessor = async ({ content, filename }) => {
  const useFilename: string = filename || '';
  const isIncluded = isFileIncluded(pluginOptions.includePaths, useFilename);

  if (!isIncluded || (!pluginOptions.parseStyleTag && !pluginOptions.parseExternalStylesheet)) {
    return { code: content };
  }
  let ast: Ast;
  try {
    ast = parse(content, { filename: useFilename });
  } catch (err) {
    throw new Error(
      `${err}\n\nThe svelte component failed to be parsed. Make sure cssModules is running after all other preprocessors by wrapping them with "cssModulesPreprocess().after()"`
    );
  }

  if (
    !pluginOptions.useAsDefaultScoping &&
    !hasModuleAttribute(ast) &&
    !hasModuleImports(content)
  ) {
    return { code: content };
  }

  if (!ast.css) {
    return { code: content };
  }

  // eslint-disable-next-line prefer-const
  let { mode, hashSeeder } = pluginOptions;

  if (pluginOptions.parseStyleTag && hasModuleAttribute(ast)) {
    const moduleAttribute = ast.css.attributes.find((item) => item.name === 'module');
    mode = moduleAttribute.value !== true ? moduleAttribute.value[0].data : mode;
  }

  if (!['native', 'mixed', 'scoped'].includes(mode)) {
    throw new Error(`Module only accepts 'native', 'mixed' or 'scoped': '${mode}' was passed.`);
  }

  hashSeeder.forEach((value) => {
    if (!['style', 'filepath', 'classname'].includes(value)) {
      throw new Error(
        `The hash seeder only accepts the keys 'style', 'filepath' and 'classname': '${value}' was passed.`
      );
    }
  });

  let parsedContent: string;

  switch (mode) {
    case 'scoped': {
      parsedContent = await scopedProcessor(ast, content, useFilename, pluginOptions);
      break;
    }
    case 'mixed': {
      parsedContent = await mixedProcessor(ast, content, useFilename, pluginOptions);
      break;
    }
    default: {
      parsedContent = await nativeProcessor(ast, content, useFilename, pluginOptions);
      break;
    }
  }

  return {
    code: parsedContent,
  };
};

/**
 * css Modules
 * @param options
 * @returns the css modules preprocessors
 */
const cssModulesPreprocessor = (options: Partial<PluginOptions>): PreprocessorGroup => {
  pluginOptions = {
    ...defaultOptions(),
    ...options,
  };

  if (pluginOptions.includePaths) {
    pluginOptions.includePaths = normalizeIncludePaths(pluginOptions.includePaths);
  }

  return {
    markup,
  };
};

/**
 * Create a group of preprocessors which will be processed in a linear order
 * @param preprocessors list of preprocessors
 * @returns group of `markup` preprocessors
 */
const linearPreprocessor = (preprocessors: PreprocessorGroup[]): PreprocessorGroup[] => {
  return preprocessors.map((p) => {
    return !p.script && !p.style
      ? p
      : {
          async markup({ content, filename }) {
            return preprocess(content, p, { filename });
          },
        };
  });
};

// export default cssModulesPreprocessor;
export default exports = module.exports = cssModulesPreprocessor;
export const cssModules = cssModulesPreprocessor;
export const linearPreprocess = linearPreprocessor;

// const cssModulesPreprocessor: any = module.exports = cssModules;
// cssModulesPreprocessor.cssModules = cssModules;
// cssModulesPreprocessor.linearPreprocess = linearPreprocess;
// export default module.exports = cssModules;
