// @ts-expect-error walk is not in d.ts
import { walk } from 'svelte/compiler';
import type MagicString from 'magic-string';
import type { Ast, TemplateNode } from 'svelte/types/compiler/interfaces.d';
import type { CSSModuleList } from '../types';

/**
 * Update a string of multiple Classes
 * @param classNames The attribute value containing one or multiple classes
 * @param cssModuleList List of available CSS Modules classNames
 * @returns the CSS Modules version
 */
const updateMultipleClasses = (classNames: string, cssModuleList: CSSModuleList): string => {
  const classes: string[] = classNames.split(' ');
  const generatedClassNames: string = classes.reduce((accumulator, currentValue, currentIndex) => {
    let value: string = currentValue;
    if (currentValue in cssModuleList) {
      value = cssModuleList[currentValue.trim()];
    }
    if (currentIndex < classes.length - 1) {
      value += ' ';
    }
    return `${accumulator}${value}`;
  }, '');

  return generatedClassNames;
};

/**
 * Parse and update classes of a js expression element
 * @param expression The expression node (consequent, alternate)
 * @param magicContent The component content handled with MagicString
 * @param cssModuleList List of available CSS Modules classNames
 * @return The updated magic content
 */
const parseExpression = (
  expression: TemplateNode,
  magicContent: MagicString,
  cssModuleList: CSSModuleList
): MagicString => {
  if (expression.type === 'Literal') {
    const generatedClassNames = updateMultipleClasses(expression.value, cssModuleList);
    magicContent.overwrite(expression.start, expression.end, `'${generatedClassNames}'`);
  }

  return magicContent;
};

/**
 * Parse the template markup to update the class attributes with CSS modules
 * @param ast The component AST Tree
 * @param magicContent The component content handled with MagicString
 * @param cssModuleList List of available CSS Modules classNames
 * @return The updated magic content
 */
const parseTemplate = (
  ast: Ast,
  magicContent: MagicString,
  cssModuleList: CSSModuleList
): MagicString => {
  const directiveLength: number = 'class:'.length;
  let content: MagicString = magicContent;

  walk(ast, {
    enter(node: TemplateNode) {
      if (node.type === 'Script' || node.type === 'Style') {
        this.skip();
      }

      if (node.type === 'Element' && node.attributes.length > 0) {
        node.attributes.forEach((item: TemplateNode) => {
          if (item.type === 'Attribute') {
            item.value.forEach((classItem: TemplateNode) => {
              if (classItem.type === 'Text') {
                const generatedClassNames = updateMultipleClasses(classItem.data, cssModuleList);
                content.overwrite(
                  classItem.start,
                  classItem.start + classItem.data.length,
                  generatedClassNames
                );
              } else if (
                classItem.type === 'MustacheTag' &&
                classItem?.expression?.type === 'ConditionalExpression'
              ) {
                const { consequent, alternate } = classItem.expression;
                content = parseExpression(consequent, content, cssModuleList);
                content = parseExpression(alternate, content, cssModuleList);
              }
            });
          }
          if (item.type === 'Class' && item.name in cssModuleList) {
            const start = item.start + directiveLength;
            const end = start + item.name.length;
            content.overwrite(start, end, cssModuleList[item.name]);
          }
        });
      }
    },
  });

  return content;
};

export default parseTemplate;
