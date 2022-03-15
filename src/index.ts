import { parse, preprocess } from 'svelte/compiler';
import type { Ast } from 'svelte/types/compiler/interfaces.d';
import type {
  PreprocessorGroup,
  Processed,
  MarkupPreprocessor,
} from 'svelte/types/compiler/preprocess/index.d';
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

const markup: MarkupPreprocessor = async ({ content, filename }) => {
  const isIncluded = isFileIncluded(pluginOptions.includePaths, filename);

  if (!isIncluded || (!pluginOptions.parseStyleTag && !pluginOptions.parseExternalStylesheet)) {
    return { code: content };
  }
  let ast: Ast;
  try {
    ast = parse(content, { filename });
  } catch (err) {
    throw new Error(
      `${err}\n\nThe svelte component failed to be parsed. Make sure cssModules is running after all other preprocessors by wrapping them with "appendCssModules()"`
    );
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

export const cssModules = (options: Partial<PluginOptions>): PreprocessorGroup => {
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

export const appendCssModules = (
  preprocessors: PreprocessorGroup[] | PreprocessorGroup,
  options: Partial<PluginOptions>
): PreprocessorGroup[] => {
  return [
    {
      async markup({ content, filename }): Promise<Processed> {
        let code = content;
        let dependencies: Processed['dependencies'] = [];

        const preprocessorGroup = Array.isArray(preprocessors) ? preprocessors : [preprocessors];

        for (let i = 0; i < preprocessorGroup.length; i += 1) {
          const preprocessor = preprocessorGroup[i];
          // eslint-disable-next-line no-await-in-loop
          const processed = await preprocess(code, preprocessor, { filename });

          code = processed?.code ?? code;

          if (processed?.dependencies?.length) {
            dependencies = [...dependencies, ...processed.dependencies];
          }
        }

        return {
          code,
          dependencies,
        };
      },
    },
    cssModules(options),
  ];
};

export default module.exports = cssModules;
