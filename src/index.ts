/* eslint-disable no-multi-assign */
import { parse } from 'svelte/compiler';
import type { AST, PreprocessorGroup, MarkupPreprocessor } from 'svelte/compiler';
import { mixedProcessor, nativeProcessor, scopedProcessor } from './processors';
import type { PluginOptions } from './types';
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
  if (
    !filename ||
    !isFileIncluded(pluginOptions.includePaths, filename) ||
    (!pluginOptions.parseStyleTag && !pluginOptions.parseExternalStylesheet)
  ) {
    return { code: content };
  }

  let ast: AST.Root;
  try {
    ast = parse(content, { modern: true, filename });
  } catch (err) {
    throw new Error(`${err}\n\nThe svelte component failed to be parsed.`);
  }

  if (
    !pluginOptions.useAsDefaultScoping &&
    !hasModuleAttribute(ast) &&
    !hasModuleImports(content)
  ) {
    return { code: content };
  }

  // eslint-disable-next-line prefer-const
  let { mode, hashSeeder } = pluginOptions;

  if (pluginOptions.parseStyleTag && hasModuleAttribute(ast)) {
    const moduleAttribute = ast.css?.attributes.find((item) => item.name === 'module');
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

  let processor = nativeProcessor;

  if (mode === 'mixed') {
    processor = mixedProcessor;
  } else if (mode === 'scoped') {
    processor = scopedProcessor;
  }

  const parsedContent = await processor(ast, content, filename, pluginOptions);
  return { code: parsedContent };
};

/**
 * css Modules
 * @param options
 * @returns the css modules preprocessors
 */
const cssModulesPreprocessor = (options: Partial<PluginOptions> = {}): PreprocessorGroup => {
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

// export default cssModulesPreprocessor;
export default exports = module.exports = cssModulesPreprocessor;
export const cssModules = cssModulesPreprocessor;

// const cssModulesPreprocessor: any = module.exports = cssModules;
// cssModulesPreprocessor.cssModules = cssModules;
// export default module.exports = cssModules;
