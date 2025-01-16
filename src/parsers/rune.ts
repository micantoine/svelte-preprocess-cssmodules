import { BaseNode, walk } from 'estree-walker';
import Processor from '../processors/processor';
import { updateMultipleClasses } from './template';

export const replaceRune = (processor: Processor, node: BaseNode) => {
  const callExpr = node as {
    type: 'CallExpression';
    callee?: { type: string; name: string };
    start: number;
    end: number;
    arguments?: Array<{ type: string; value?: string; start: number; end: number }>;
  };
  if (
    callExpr.type === 'CallExpression' &&
    callExpr.callee?.type === 'Identifier' &&
    callExpr.callee?.name === '$css'
  ) {
    const args = callExpr.arguments as Array<{
      type: string;
      value: string;
      start: number;
      end: number;
    }>;

    if (args.length !== 1 || args[0].type !== 'Literal') {
      throw new Error('Invalid $css call');
    }
    const classNames = args[0].value;

    const generatedClassNames = updateMultipleClasses(processor, classNames);
    processor.magicContent.overwrite(callExpr.start, callExpr.end, `"${generatedClassNames}"`);
  }
};

/**
 * Parse the template markup and script to process the $css rune
 * @param processor The CSS Module Processor
 */

export default (processor: Processor): void => {
  if (processor.ast.fragment) {
    walk(processor.ast.fragment, {
      enter(baseNode) {
        replaceRune(processor, baseNode);
      },
    });
  }
  if (processor.ast.instance) {
    walk(processor.ast.instance, {
      enter(baseNode) {
        replaceRune(processor, baseNode);
      },
    });
  }
};
