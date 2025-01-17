import { walk } from 'estree-walker';
import type { AST } from 'svelte/compiler';
import type Processor from '../processors/processor';

interface CssVariables {
  styleAttribute: string;
  values: string;
}

/**
 * Update a string of multiple Classes
 * @param processor The CSS Module Processor
 * @param classNames The attribute value containing one or multiple classes
 * @returns the CSS Modules classnames
 */
export const updateMultipleClasses = (processor: Processor, classNames: string): string => {
  const classes: string[] = classNames.split(' ');
  const generatedClassNames: string = classes.reduce((accumulator, currentValue, currentIndex) => {
    let value: string = currentValue;
    const rawValue: string = value.trim();
    if (rawValue in processor.cssModuleList) {
      value = value.replace(rawValue, processor.cssModuleList[rawValue]);
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
 * @param processor: The CSS Module Processor
 * @param expression The expression node (consequent, alternate)
 */
const parseExpression = (
  processor: Processor,
  expression: AST.ExpressionTag['expression']
): void => {
  const exp = expression as typeof expression & AST.BaseNode;
  if (exp.type === 'Literal' && typeof exp.value === 'string') {
    const generatedClassNames = updateMultipleClasses(processor, exp.value);
    processor.magicContent.overwrite(exp.start, exp.end, `'${generatedClassNames}'`);
  }
};

/**
 * Add the dynamic variables to elements
 * @param processor The CSS Module Processor
 * @param node the node element
 * @param cssVar the cssVariables data
 */
const addDynamicVariablesToElements = (
  processor: Processor,
  fragment: AST.Fragment,
  cssVar: CssVariables
): void => {
  fragment.nodes?.forEach((childNode) => {
    if (childNode.type === 'Component' || childNode.type === 'KeyBlock') {
      addDynamicVariablesToElements(processor, childNode.fragment, cssVar);
    } else if (childNode.type === 'EachBlock') {
      addDynamicVariablesToElements(processor, childNode.body, cssVar);
      if (childNode.fallback) {
        addDynamicVariablesToElements(processor, childNode.fallback, cssVar);
      }
    } else if (childNode.type === 'SnippetBlock') {
      addDynamicVariablesToElements(processor, childNode.body, cssVar);
    } else if (childNode.type === 'RegularElement') {
      const attributesLength = childNode.attributes.length;
      if (attributesLength) {
        const styleAttr = childNode.attributes.find(
          (attr) => attr.type !== 'SpreadAttribute' && attr.name === 'style'
        ) as AST.Attribute;
        if (styleAttr && Array.isArray(styleAttr.value)) {
          processor.magicContent.appendLeft(styleAttr.value[0].start, cssVar.values);
        } else {
          const lastAttr = childNode.attributes[attributesLength - 1];
          processor.magicContent.appendRight(lastAttr.end, ` ${cssVar.styleAttribute}`);
        }
      } else {
        processor.magicContent.appendRight(
          childNode.start + childNode.name.length + 1,
          ` ${cssVar.styleAttribute}`
        );
      }
    } else if (childNode.type === 'IfBlock') {
      addDynamicVariablesToElements(processor, childNode.consequent, cssVar);
      if (childNode.alternate) {
        addDynamicVariablesToElements(processor, childNode.alternate, cssVar);
      }
    } else if (childNode.type === 'AwaitBlock') {
      if (childNode.pending) {
        addDynamicVariablesToElements(processor, childNode.pending, cssVar);
      }
      if (childNode.then) {
        addDynamicVariablesToElements(processor, childNode.then, cssVar);
      }
      if (childNode.catch) {
        addDynamicVariablesToElements(processor, childNode.catch, cssVar);
      }
    }
  });
};

/**
 * Get the formatted css variables values
 * @param processor: The CSS Module Processor
 * @returns the values and the style attribute;
 */
const cssVariables = (processor: Processor): CssVariables => {
  const cssVarListKeys = Object.keys(processor.cssVarList);
  let styleAttribute = '';
  let values = '';

  if (cssVarListKeys.length) {
    for (let i = 0; i < cssVarListKeys.length; i += 1) {
      const key = cssVarListKeys[i];
      values += `--${processor.cssVarList[key]}:{${key}};`;
    }
    styleAttribute = `style="${values}"`;
  }

  return { styleAttribute, values };
};

/**
 * Parse the template markup to update the class attributes with CSS modules
 * @param processor The CSS Module Processor
 */
export default (processor: Processor): void => {
  const directiveLength: number = 'class:'.length;
  const allowedAttributes = ['class', ...processor.options.includeAttributes];

  const cssVar = cssVariables(processor);
  let dynamicVariablesAdded = false;

  walk(processor.ast.fragment, {
    enter(baseNode) {
      const node = baseNode as AST.Fragment | AST.Fragment['nodes'][0];

      // css variables on parent elements
      if (node.type === 'Fragment' && cssVar.values.length && !dynamicVariablesAdded) {
        dynamicVariablesAdded = true;
        addDynamicVariablesToElements(processor, node, cssVar);
      }

      if (
        ['RegularElement', 'Component'].includes(node.type) &&
        (node as AST.Component | AST.RegularElement).attributes.length > 0
      ) {
        (node as AST.Component | AST.RegularElement).attributes.forEach((item) => {
          if (
            item.type === 'Attribute' &&
            allowedAttributes.includes(item.name) &&
            Array.isArray(item.value)
          ) {
            item.value.forEach((classItem) => {
              if (classItem.type === 'Text' && classItem.data.length > 0) {
                const generatedClassNames = updateMultipleClasses(processor, classItem.data);
                processor.magicContent.overwrite(
                  classItem.start,
                  classItem.start + classItem.data.length,
                  generatedClassNames
                );
              } else if (
                classItem.type === 'ExpressionTag' &&
                classItem?.expression?.type === 'ConditionalExpression'
              ) {
                const { consequent, alternate } = classItem.expression;
                parseExpression(processor, consequent);
                parseExpression(processor, alternate);
              }
            });
          }
          if (item.type === 'ClassDirective') {
            const classNames = item.name.split('.');
            const name = classNames.length > 1 ? classNames[1] : classNames[0];
            if (name in processor.cssModuleList) {
              const start = item.start + directiveLength;
              const end = start + item.name.length;
              if (item.expression.type === 'Identifier' && item.name === item.expression.name) {
                processor.magicContent.overwrite(
                  start,
                  end,
                  `${processor.cssModuleList[name]}={${item.name}}`
                );
              } else {
                processor.magicContent.overwrite(start, end, processor.cssModuleList[name]);
              }
            }
          }
        });
      }
    },
  });
};
