import { walk } from 'estree-walker';
import type { AST } from 'svelte/compiler';
import type { PluginOptions } from '../types';
import Processor from './processor';

type Boundaries = { start: number; end: number };

/**
 * Update the selector boundaries
 * @param boundaries The current boundaries
 * @param start the new boundary start value
 * @param end  the new boundary end value
 * @returns the updated boundaries
 */
const updateSelectorBoundaries = (
  boundaries: Boundaries[],
  start: number,
  end: number
): Boundaries[] => {
  const selectorBoundaries = boundaries;
  const lastIndex = selectorBoundaries.length - 1;
  if (selectorBoundaries[lastIndex]?.end === start) {
    selectorBoundaries[lastIndex].end = end;
  } else if (selectorBoundaries.length < 1 || selectorBoundaries[lastIndex].end < end) {
    selectorBoundaries.push({ start, end });
  }
  return selectorBoundaries;
};

/**
 * The native style parser
 * @param processor The CSS Module Processor
 */
const parser = (processor: Processor): void => {
  if (!processor.ast.css) {
    return;
  }

  let selectorBoundaries: Boundaries[] = [];

  walk(processor.ast.css, {
    enter(baseNode) {
      (baseNode as AST.CSS.StyleSheet).children?.forEach((node) => {
        if (node.type === 'Atrule' && node.name === 'keyframes') {
          processor.parseKeyframes(node);
        }
        if (node.type === 'Rule') {
          node.prelude.children.forEach((child) => {
            child.children.forEach((grandChild) => {
              if (grandChild.type === 'RelativeSelector') {
                let start = 0;
                let end = 0;

                grandChild.selectors.forEach((item, index) => {
                  if (item.type === 'Percentage') {
                    return;
                  }

                  let hasPushed = false;
                  if (
                    item.type === 'PseudoClassSelector' &&
                    (item.name === 'global' || item.name === 'local')
                  ) {
                    if (start > 0 && end > 0) {
                      selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
                      hasPushed = true;
                    }
                    start = item.end + 1;
                    end = 0;
                  } else if (item.start && item.end) {
                    if (start === 0) {
                      start = item.start;
                    }
                    end = item.end;
                  }

                  if (
                    hasPushed === false &&
                    grandChild.selectors &&
                    index === grandChild.selectors.length - 1 &&
                    end > 0
                  ) {
                    selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
                  }
                });

                grandChild.selectors.forEach((item) => {
                  processor.parsePseudoLocalSelectors(item);
                  processor.parseClassSelectors(item);
                });
              }
            });
          });

          processor.parseBoundVariables(node.block);
          processor.storeAnimationProperties(node.block);
        }
      });
    },
  });

  processor.overwriteAnimationProperties();

  selectorBoundaries.forEach((boundary) => {
    processor.magicContent.appendLeft(boundary.start, ':global(');
    processor.magicContent.appendRight(boundary.end, ')');
  });
};

const nativeProcessor = async (
  ast: AST.Root,
  content: string,
  filename: string,
  options: PluginOptions
): Promise<string> => {
  const processor = new Processor(ast, content, filename, options, parser);
  const processedContent = processor.parse();
  return processedContent;
};

export default nativeProcessor;
