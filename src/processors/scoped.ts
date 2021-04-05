import path from 'path';
import fs, { constants } from 'fs';
// @ts-expect-error walk is not in d.ts
import { parse, walk } from 'svelte/compiler';
import MagicString from 'magic-string';
import type { Ast, TemplateNode, Style } from 'svelte/types/compiler/interfaces.d';
import type { PluginOptions, CSSModuleList } from '../types';
import { camelCase, createClassName } from '../lib';
import parseTemplate from './parseTemplate';

const cssModuleList: CSSModuleList = {};
const style: { ast: Style; openTag: string; closeTag: string } = {
  ast: null,
  openTag: '<style module>',
  closeTag: '</style>',
};
let processedFilename: string;
let pluginOptions: PluginOptions;
let unParsedContent: string;

const parseStyle = (ast: Ast, magicContent: MagicString): MagicString => {
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

  return magicContent;
};

const parseImport = async (ast: Ast, magicContent: MagicString): Promise<MagicString> => {
  walk(ast, {
    enter(node: TemplateNode) {
      if (node.type === 'Style' || node.type === 'Fragment') {
        this.skip();
      }
      if (
        node.type === 'ImportDeclaration' &&
        node.source.value.search(/\.module\.s?css$/) !== -1
      ) {
        console.log(node);
        const absolutePath = path.resolve(path.dirname(processedFilename), node.source.value);
        const nodeModulesPath = path.resolve(`${path.resolve()}/node_modules`, node.source.value);

        try {
          const fileContent = fs.readFileSync(absolutePath, 'utf8');
          const fileStyle = `${style.openTag}${fileContent}${style.closeTag}`;
          if (node.specifiers.length === 0) {
            let fileMagicContent = new MagicString(fileStyle);
            fileMagicContent = parseStyle(
              parse(fileStyle, { filename: absolutePath }),
              fileMagicContent
            );
            magicContent.remove(node.start, node.end);
            magicContent.prependLeft(
              style.ast.content.start,
              fileMagicContent.toString().replace(style.openTag, '').replace(style.closeTag, '')
            );
          } else {
            console.log('todo');
          }
        } catch (err) {
          fs.access(nodeModulesPath, constants.F_OK, (error) => {
            if (error) {
              throw new Error(err); // not found in node_modules packages either, throw orignal error
            }
          });
        }
      }
    },
  });
  return magicContent;
};

const processor = async (
  ast: Ast,
  content: string,
  filename: string,
  options: PluginOptions
): Promise<string> => {
  let magicContent = new MagicString(content);

  processedFilename = filename;
  pluginOptions = options;
  unParsedContent = content;

  if (ast.css) {
    magicContent = parseStyle(ast, magicContent);
  }

  if (ast.instance) {
    if (ast.css) {
      style.ast = ast.css;
      style.openTag = unParsedContent.substring(style.ast.start, style.ast.content.start);
    }
    magicContent = await parseImport(ast, magicContent);
    console.log(magicContent.toString());
  }

  if (Object.keys(cssModuleList).length > 0) {
    magicContent = parseTemplate(ast, magicContent, cssModuleList);
  }

  return magicContent.toString();
};

export default processor;
