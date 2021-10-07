import { parse } from 'svelte/compiler';
import type { Ast } from 'svelte/types/compiler/interfaces.d';
import type { PluginOptions, PreprocessorOptions, PreprocessorResult } from './types';
import { nativeProcessor, mixedProcessor, scopedProcessor } from './processors';
import { getLocalIdent, isFileIncluded, hasModuleImports, hasModuleAttribute } from './lib';

const defaultOptions = (): PluginOptions => {
  return {
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

const markup = async ({ content, filename }: PreprocessorOptions): Promise<PreprocessorResult> => {
  const isIncluded = await isFileIncluded(pluginOptions.includePaths, filename);

  if (!isIncluded || (!pluginOptions.parseStyleTag && !pluginOptions.parseExternalStylesheet)) {
    return { code: content };
  }

  const ast: Ast = parse(content, { filename });

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

export default module.exports = (options: Partial<PluginOptions>) => {
  pluginOptions = {
    ...defaultOptions(),
    ...options,
  };
  return {
    markup,
  };
};
