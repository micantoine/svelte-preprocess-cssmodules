// @ts-expect-error walk is not in d.ts
import { walk } from 'svelte/compiler';

import type { Ast } from 'svelte/types/compiler/interfaces.d';
import type { PluginOptions, CSSModuleDirectory, CSSModuleList } from '../types';

const cssModuleDirectory: CSSModuleDirectory = {};

const processor = async (
  ast: Ast,
  content: string,
  filename: string,
  pluginOptions: PluginOptions
): Promise<string> => {
  return content;
};

export default processor;
