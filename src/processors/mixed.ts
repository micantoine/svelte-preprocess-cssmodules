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
  if (selectorBoundaries[selectorBoundaries.length - 1]?.end === start) {
    selectorBoundaries[selectorBoundaries.length - 1].end = end;
  } else {
    selectorBoundaries.push({ start, end });
  }
  return selectorBoundaries;
};

/**
 * The mixed style parser
 * @param processor The CSS Module Processor
 */
const parser = (processor: Processor): void => {
  if (!processor.ast.css) {
    return;
  }
  walk(processor.ast.css, {
    enter(baseNode) {
      (baseNode as AST.CSS.StyleSheet).children?.forEach((node) => {
        if (node.type === 'Atrule' && node.name === 'keyframes') {
          processor.parseKeyframes(node);
          this.skip();
        }
        if (node.type === 'Rule') {
          node.prelude.children.forEach((child) => {
            child.children.forEach((grandChild) => {
              if (grandChild.type === 'RelativeSelector') {
                const classSelectors = grandChild.selectors.filter(
                  (item) => item.type === 'ClassSelector'
                );
                if (classSelectors.length > 0) {
                  let selectorBoundaries: Array<Boundaries> = [];
                  let start = 0;
                  let end = 0;

                  grandChild.selectors.forEach((item, index) => {
                    if (!item.start && start > 0) {
                      selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
                      start = 0;
                      end = 0;
                    } else {
                      let hasPushed = false;
                      if (end !== item.start) {
                        start = item.start;
                        end = item.end;
                      } else {
                        selectorBoundaries = updateSelectorBoundaries(
                          selectorBoundaries,
                          start,
                          item.end
                        );
                        hasPushed = true;
                        start = 0;
                        end = 0;
                      }
                      if (
                        hasPushed === false &&
                        grandChild.selectors &&
                        index === grandChild.selectors.length - 1
                      ) {
                        selectorBoundaries = updateSelectorBoundaries(
                          selectorBoundaries,
                          start,
                          end
                        );
                      }
                    }
                  });

                  selectorBoundaries.forEach((boundary) => {
                    const hasClassSelector = classSelectors.filter(
                      (item) => boundary.start <= item.start && boundary.end >= item.end
                    );
                    if (hasClassSelector.length > 0) {
                      processor.magicContent.appendLeft(boundary.start, ':global(');
                      processor.magicContent.appendRight(boundary.end, ')');
                    }
                  });
                }

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
};

const mixedProcessor = async (
  ast: AST.Root,
  content: string,
  filename: string,
  options: PluginOptions
): Promise<string> => {
  const processor = new Processor(ast, content, filename, options, parser);
  const processedContent = processor.parse();
  return processedContent;
};

export default mixedProcessor;
