import { walk } from 'estree-walker';
import type { AST } from 'svelte/compiler';
import type { PluginOptions } from '../types';
import Processor from './processor';

/**
 * The scoped style parser
 * @param processor The CSS Module Processor
 */
const parser = (processor: Processor): void => {
  if (!processor.ast.css) {
    return;
  }
  walk(processor.ast.css, {
    enter(baseNode) {
      (baseNode as AST.CSS.StyleSheet).children?.forEach((node) => {
        if (node.type === 'Rule') {
          node.prelude.children.forEach((child) => {
            child.children.forEach((grandChild) => {
              if (grandChild.type === 'RelativeSelector') {
                grandChild.selectors.forEach((item) => {
                  processor.parsePseudoLocalSelectors(item);
                  processor.parseClassSelectors(item);
                });
              }
            });
          });

          processor.parseBoundVariables(node.block);
        }
      });
    },
  });
};

const scopedProcessor = async (
  ast: AST.Root,
  content: string,
  filename: string,
  options: PluginOptions
): Promise<string> => {
  const processor = new Processor(ast, content, filename, options, parser);
  const processedContent = processor.parse();
  return processedContent;
};

export default scopedProcessor;
