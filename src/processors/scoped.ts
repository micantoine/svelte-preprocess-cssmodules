// @ts-expect-error walk is not in d.ts
import { walk } from 'svelte/compiler';
import MagicString from 'magic-string';

import type { Ast, TemplateNode } from 'svelte/types/compiler/interfaces.d';
import type { PluginOptions, CSSModuleList } from '../types';
import { camelCase, createClassName } from '../lib';

const cssModuleList: CSSModuleList = {};
let processedFilename: string;
let pluginOptions: PluginOptions;
let unParsedContent: string;
let magicContent: MagicString;

const parseStyle = (ast: Ast): void => {
  walk(ast, {
    enter(node: TemplateNode) {
      if (node.type === 'Script' || node.type === 'Fragment') {
        this.skip();
      }
      if (node.type === 'ClassSelector') {
        const generatedClassName = createClassName(
          processedFilename,
          unParsedContent,
          ast.css.content.styles,
          node.name,
          pluginOptions
        );
        cssModuleList[node.name] = generatedClassName;
        magicContent.overwrite(node.start, node.end, `.${generatedClassName}`);
      }
    },
  });
};

const parseMarkup = (ast: Ast): void => {
  const directiveLength: number = 'class:'.length;
  walk(ast, {
    enter(node: TemplateNode) {
      if (node.type === 'Script' || node.type === 'Style') {
        this.skip();
      }

      if (node.type === 'Element' && node.attributes.length > 0) {
        node.attributes.forEach((item: any) => {
          if (item.type === 'Attribute') {
            item.value.forEach((classItem: any) => {
              if (classItem.data in cssModuleList) {
                magicContent.overwrite(
                  classItem.start,
                  classItem.end,
                  cssModuleList[classItem.data]
                );
              }
            });
          }
          if (item.type === 'Class' && item.name in cssModuleList) {
            const start = item.start + directiveLength;
            const end = start + item.name.length;
            magicContent.overwrite(start, end, cssModuleList[item.name]);
          }
        });
      }
    },
  });
};

const processor = async (
  ast: Ast,
  content: string,
  filename: string,
  options: PluginOptions
): Promise<string> => {
  processedFilename = filename;
  pluginOptions = options;
  unParsedContent = content;
  magicContent = new MagicString(content);

  if (ast.css) {
    parseStyle(ast);
  }

  if (Object.keys(cssModuleList).length > 0) {
    parseMarkup(ast);
  }

  return magicContent.toString();
};

export default processor;
