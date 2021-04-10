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
  let selectorBoundaries: Array<Boundaries> = [];
  let globalSelectors: Array<TemplateNode> = [];

  walk(processor.ast, {
    enter(node: TemplateNode) {
      if (node.type === 'Script' || node.type === 'Fragment') {
        this.skip();
      }
      if (node.type === 'Selector') {
        globalSelectors = [
          ...globalSelectors,
          ...node.children.filter(
            (item) => item.name === 'global' && item.type === 'PseudoClassSelector'
          ),
        ];

        let start = 0;
        let end = 0;

        node.children.forEach((item, index) => {
          let hasPushed = false;
          if (item.name === 'global' && item.type === 'PseudoClassSelector') {
            if (start > 0) {
              selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
              hasPushed = true;
            }
            start = item.end + 1;
            end = 0;
          } else {
            if (start === 0) {
              start = item.start;
            }
            end = item.end;
          }

          if (!hasPushed && index === node.children.length - 1) {
            selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
          }
        });
      }

      if (node.type === 'ClassSelector') {
        const generatedClassName = processor.createModuleClassname(node.name);
        processor.addModule(node.name, generatedClassName);
        processor.magicContent.overwrite(node.start, node.end, `.${generatedClassName}`);
      }
    },
  });

  selectorBoundaries.forEach((boundary) => {
    const hasClassSelector = globalSelectors.filter(
      (item) => boundary.start <= item.start && boundary.end >= item.end
    );
    if (hasClassSelector.length < 1) {
      processor.magicContent.appendLeft(boundary.start, ':global(');
      processor.magicContent.appendRight(boundary.end, ')');
    }
  });
};

const nativeProcessor = async (
  ast: Ast,
  content: string,
  filename: string,
  options: PluginOptions
): Promise<string> => {
  const processor = new Processor(ast, content, filename, options, parser);
  const processedContent = processor.parse();
  return processedContent;
};

export default nativeProcessor;
