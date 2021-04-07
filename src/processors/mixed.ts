// @ts-expect-error walk is not in d.ts
import { walk } from 'svelte/compiler';
import type { Ast, TemplateNode } from 'svelte/types/compiler/interfaces.d';
import type { PluginOptions } from '../types';
import Processor from './processor';

/**
 * @todo create mixed parser
 *
 * @param processor
 * @name magicContent to update/manipulate the content using MagicString
 * @name createModuleClassname function to generated and return the css module classname
 */
const parser = (processor: Processor) => {
  walk(processor.ast, {
    enter(node: TemplateNode) {
      if (node.type === 'Script' || node.type === 'Fragment') {
        this.skip();
      }
      // HERE
    },
  });
};

const mixedProcessor = async (
  ast: Ast,
  content: string,
  filename: string,
  options: PluginOptions
): Promise<string> => {
  const processor = new Processor(ast, content, filename, options, parser);
  const processedContent = processor.parse();
  return processedContent;
};

export default mixedProcessor;
