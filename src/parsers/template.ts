import { walk } from 'estree-walker';
import type { Attribute, TemplateNode } from 'svelte/types/compiler/interfaces.d';
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
const updateMultipleClasses = (processor: Processor, classNames: string): string => {
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
const parseExpression = (processor: Processor, expression: TemplateNode): void => {
  if (expression.type === 'Literal') {
    const generatedClassNames = updateMultipleClasses(processor, expression.value);
    processor.magicContent.overwrite(expression.start, expression.end, `'${generatedClassNames}'`);
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
  node: TemplateNode,
  cssVar: CssVariables
): void => {
  node?.children?.forEach((childNode) => {
    if (
      childNode.type === 'InlineComponent' ||
      childNode.type === 'EachBlock' ||
      childNode.type === 'KeyBlock'
    ) {
      addDynamicVariablesToElements(processor, childNode, cssVar);
    } else if (childNode.type === 'Element') {
      const attributesLength = childNode.attributes.length;
      if (attributesLength) {
        const styleAttr = childNode.attributes.find((attr: Attribute) => attr.name === 'style');
        if (styleAttr) {
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
      addDynamicVariablesToElements(processor, childNode, cssVar);
      addDynamicVariablesToElements(processor, childNode.else, cssVar);
    } else if (childNode.type === 'AwaitBlock') {
      addDynamicVariablesToElements(processor, childNode.pending, cssVar);
      addDynamicVariablesToElements(processor, childNode.then, cssVar);
      addDynamicVariablesToElements(processor, childNode.catch, cssVar);
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

  walk(processor.ast.html, {
    enter(baseNode) {
      const node = baseNode as TemplateNode;
      if (node.type === 'Script' || node.type === 'Style') {
        this.skip();
      }

      // css variables on parent elements
      if (node.type === 'Fragment' && cssVar.values.length) {
        addDynamicVariablesToElements(processor, node, cssVar);
      }

      if (['Element', 'InlineComponent'].includes(node.type) && node.attributes.length > 0) {
        node.attributes.forEach((item: TemplateNode) => {
          if (item.type === 'Attribute' && allowedAttributes.includes(item.name)) {
            item.value.forEach((classItem: TemplateNode) => {
              if (classItem.type === 'Text' && classItem.data.length > 0) {
                const generatedClassNames = updateMultipleClasses(processor, classItem.data);
                processor.magicContent.overwrite(
                  classItem.start,
                  classItem.start + classItem.data.length,
                  generatedClassNames
                );
              } else if (
                classItem.type === 'MustacheTag' &&
                classItem?.expression?.type === 'ConditionalExpression'
              ) {
                const { consequent, alternate } = classItem.expression;
                parseExpression(processor, consequent);
                parseExpression(processor, alternate);
              }
            });
          }
          if (item.type === 'Class') {
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
