import { parse } from 'svelte/compiler';
import type { Ast } from 'svelte/types/compiler/interfaces.d';
import type { PluginOptions, PreprocessorOptions, PreprocessorResult } from './types';
import { nativeProcessor, mixedProcessor, scopedProcessor } from './processors';
import { getLocalIdent, isFileIncluded, PATTERN_IMPORT } from './lib';

let pluginOptions: PluginOptions = {
  mode: 'native',
  includePaths: [],
  localIdentName: '[local]-[hash:base64:6]',
  getLocalIdent,
  strict: false,
};

const markup = async ({ content, filename }: PreprocessorOptions): Promise<PreprocessorResult> => {
  const isIncluded = await isFileIncluded(pluginOptions.includePaths, filename);

  if (!isIncluded) {
    return { code: content };
  }

  const HAS_IMPORT = content.search(PATTERN_IMPORT) !== -1;
  const ast: Ast = parse(content, { filename });

  if (!ast.css && !HAS_IMPORT) {
    return { code: content };
  }

  const moduleAttribute = ast.css?.attributes.filter((item) => item.name === 'module')[0];

  if (!moduleAttribute && !HAS_IMPORT) {
    return { code: content };
  }

  let { mode } = pluginOptions;

  if (moduleAttribute && moduleAttribute.value !== true) {
    mode = moduleAttribute.value[0].data;
  }

  if (!['native', 'mixed', 'scoped'].includes(mode)) {
    throw new Error(`Module only accepts 'native', 'mixed' or 'scoped': '${mode}' was passed.`);
  }

  let parsedContent: string;

  switch (mode) {
    case 'scoped': {
      parsedContent = await scopedProcessor(ast, content, filename, pluginOptions);
      break;
    }
    case 'mixed': {
      parsedContent = await mixedProcessor(ast, content, filename, pluginOptions);
      break;
    }
    default: {
      parsedContent = await nativeProcessor(ast, content, filename, pluginOptions);
      break;
    }
  }

  return {
    code: parsedContent,
  };
};

// eslint-disable-next-line no-multi-assign
export default exports = module.exports = (options: Partial<PluginOptions>) => {
  pluginOptions = {
    ...pluginOptions,
    ...options,
  };

  return {
    markup,
  };
};
