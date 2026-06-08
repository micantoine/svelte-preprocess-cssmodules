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
  } else {
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

  const visitNode = (node: AST.CSS.Node): void => {
    if (node.type === 'Atrule') {
      if (node.name === 'keyframes') {
        processor.parseKeyframes(node);
        return;
      }
      // Recurse into @media, @supports, @layer, etc.
      (node.block as AST.CSS.Block)?.children?.forEach(visitNode);
      return;
    }

    if (node.type === 'Rule') {
      node.prelude.children.forEach((child) => {
        if (child.type === 'ComplexSelector') {
          let start = 0;
          let end = 0;

          child.children.forEach((grandChild, index) => {
            let hasPushed = false;
            if (grandChild.type === 'RelativeSelector') {
              grandChild.selectors.forEach((item) => {
                if (
                  item.type === 'PseudoClassSelector' &&
                  (item.name === 'global' || item.name === 'local')
                ) {
                  processor.parsePseudoLocalSelectors(item);
                  if (start > 0 && end > 0) {
                    selectorBoundaries = updateSelectorBoundaries(
                      selectorBoundaries,
                      start,
                      end
                    );
                    hasPushed = true;
                  }
                  start = item.end + 1;
                  end = 0;
                } else if (item.start && item.end) {
                  if (start === 0) {
                    start = item.start;
                  }
                  end = item.end;
                  processor.parseClassSelectors(item);
                }
              });

              if (
                hasPushed === false &&
                child.children &&
                index === child.children.length - 1 &&
                end > 0
              ) {
                selectorBoundaries = updateSelectorBoundaries(selectorBoundaries, start, end);
              }
            }
          });
        }
      });

      processor.parseBoundVariables(node.block);
      processor.storeAnimationProperties(node.block);

      // Recurse into nested rules (CSS nesting: rules inside rule blocks)
      (node.block as AST.CSS.Block)?.children?.forEach((child) => {
        if (child.type === 'Rule' || child.type === 'Atrule') {
          visitNode(child);
        }
      });
    }
  };

  processor.ast.css?.children?.forEach(visitNode);

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
