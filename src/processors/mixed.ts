import { walk } from 'svelte/compiler';
import type { Ast, TemplateNode } from 'svelte/types/compiler/interfaces';
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
  const ast = (processor.ast as unknown) as TemplateNode;
  walk(ast.expression, {
    enter(baseNode) {
      const node = baseNode as TemplateNode;
      if (node.type === 'Script' || node.type === 'Fragment') {
        this.skip();
      }

      if (node.type === 'Atrule' && node.name === 'keyframes') {
        processor.parseKeyframes(node);
        this.skip();
      }

      if (node.type === 'Selector') {
        const classSelectors = node.children
          ? node.children.filter((item: { type: string }) => item.type === 'ClassSelector')
          : [];
        if (classSelectors.length > 0) {
          let selectorBoundaries: Array<Boundaries> = [];
          let start = 0;
          let end = 0;

          if (node.children) {
            node.children.forEach((item: { start: number; end: number }, index: number) => {
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
                if (hasPushed === false && node.children && index === node.children.length - 1) {
                  selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
                }
              }
            });
          }

          selectorBoundaries.forEach((boundary) => {
            const hasClassSelector = classSelectors.filter(
              (item: { start: number; end: number }) =>
                boundary.start <= item.start && boundary.end >= item.end
            );
            if (hasClassSelector.length > 0) {
              processor.magicContent.appendLeft(boundary.start, ':global(');
              processor.magicContent.appendRight(boundary.end, ')');
            }
          });
        }
      }

      processor.parseBoundVariables(node);
      processor.parsePseudoLocalSelectors(node);
      processor.storeAnimationProperties(node);
      console.log(node);

      if (node.type === 'ClassSelector') {
        const generatedClassName = processor.createModuleClassname(node.name);
        processor.addModule(node.name, generatedClassName);
        processor.magicContent.overwrite(node.start, node.end, `.${generatedClassName}`);
      }
    },
  });

  processor.overwriteAnimationProperties();
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
