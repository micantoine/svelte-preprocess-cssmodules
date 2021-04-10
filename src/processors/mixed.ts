// @ts-expect-error walk is not in d.ts
import { walk } from 'svelte/compiler';
import type { Ast, TemplateNode } from 'svelte/types/compiler/interfaces.d';
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
 * The mixed Style parser
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

      if (node.type === 'Selector') {
        const classSelectors = node.children.filter((item) => item.type === 'ClassSelector');
        if (classSelectors.length > 0) {
          let selectorBoundaries: Array<Boundaries> = [];
          let start = 0;
          let end = 0;

          node.children.forEach((item, index) => {
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
                selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, item.end);
                hasPushed = true;
                start = 0;
                end = 0;
              }
              if (hasPushed === false && index === node.children.length - 1) {
                selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
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
      }
      if (node.type === 'ClassSelector') {
        const generatedClassName = processor.createModuleClassname(node.name);
        processor.addModule(node.name, generatedClassName);
        processor.magicContent.overwrite(node.start, node.end, `.${generatedClassName}`);
      }
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
