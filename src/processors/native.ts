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
  const ast = (processor.ast as unknown) as TemplateNode;
  let selectorBoundaries: Boundaries[] = [];

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
        let start = 0;
        let end = 0;

        if (node.children) {
          node.children.forEach((item, index) => {
            let hasPushed = false;
            if (
              (item.name === 'global' || item.name === 'local') &&
              item.type === 'PseudoClassSelector'
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

            if (!hasPushed && node.children && index === node.children.length - 1 && end > 0) {
              selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
            }
          });
        }
      }

      processor.parseBoundVariables(node);
      processor.parsePseudoLocalSelectors(node);
      processor.storeAnimationProperties(node);

      if (node.type === 'ClassSelector') {
        const generatedClassName = processor.createModuleClassname(node.name);
        processor.addModule(node.name, generatedClassName);
        processor.magicContent.overwrite(node.start, node.end, `.${generatedClassName}`);
      }
    },
  });

  processor.overwriteAnimationProperties();

  selectorBoundaries.forEach((boundary) => {
    processor.magicContent.appendLeft(boundary.start, ':global(');
    processor.magicContent.appendRight(boundary.end, ')');
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
