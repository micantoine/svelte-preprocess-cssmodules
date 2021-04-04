// @ts-expect-error walk is not in d.ts
import { walk } from 'svelte/compiler';
import MagicString from 'magic-string';
import type { Ast, TemplateNode } from 'svelte/types/compiler/interfaces.d';
import type { PluginOptions, CSSModuleList } from '../types';
import { camelCase, createClassName } from '../lib';
import parseTemplate from './parseTemplate';

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
    magicContent = parseTemplate(ast, magicContent, cssModuleList);
  }

  return magicContent.toString();
};

export default processor;
