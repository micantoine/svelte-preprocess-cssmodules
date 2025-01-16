/* eslint-disable no-param-reassign */
import path from 'path';
import fs, { constants } from 'fs';
import MagicString from 'magic-string';
import { parse, type AST } from 'svelte/compiler';
import { walk } from 'estree-walker';
import type { ImportDeclaration } from 'estree';
import type Processor from '../processors/processor';

/**
 * Parse CssModules Imports
 */
export default (processor: Processor): void => {
  if (!processor.ast.instance) {
    return;
  }

  const backup = { ...processor };

  let importedContent = '';

  walk(processor.ast.instance, {
    enter(baseNode) {
      (baseNode as AST.Script).content?.body.forEach((node) => {
        if (
          node.type === 'ImportDeclaration' &&
          String(node.source.value)?.search(/\.module\.s?css$/) !== -1
        ) {
          const nodeBody = node as ImportDeclaration & AST.BaseNode;
          const sourceValue = String(nodeBody.source.value);
          const absolutePath = path.resolve(path.dirname(processor.filename), sourceValue);
          const nodeModulesPath = path.resolve(`${path.resolve()}/node_modules`, sourceValue);

          try {
            processor.importedCssModuleList = {};
            const fileContent = fs.readFileSync(absolutePath, 'utf8');
            const fileStyle = `${processor.style.openTag}${fileContent}${processor.style.closeTag}`;

            let fileMagicContent = new MagicString(fileStyle);

            processor.ast = parse(fileStyle, {
              filename: absolutePath,
              modern: true,
            });
            processor.magicContent = fileMagicContent;
            processor.cssKeyframeList = {};
            processor.cssAnimationProperties = [];

            processor.styleParser(processor);

            fileMagicContent = processor.magicContent;
            processor.ast = backup.ast;
            processor.magicContent = backup.magicContent;
            processor.cssKeyframeList = backup.cssKeyframeList;
            processor.cssAnimationProperties = backup.cssAnimationProperties;

            if (nodeBody.specifiers.length === 0) {
              processor.magicContent.remove(nodeBody.start, nodeBody.end);
            } else if (nodeBody.specifiers[0].type === 'ImportDefaultSpecifier') {
              const specifiers = `const ${nodeBody.specifiers[0].local.name} = ${JSON.stringify(
                processor.importedCssModuleList
              )};`;
              processor.magicContent.overwrite(nodeBody.start, nodeBody.end, specifiers);
            } else {
              const specifierNames = nodeBody.specifiers.map((item) => {
                return item.local.name;
              });
              const specifiers = `const { ${specifierNames.join(', ')} } = ${JSON.stringify(
                Object.fromEntries(
                  Object.entries(processor.importedCssModuleList).filter(([key]) =>
                    specifierNames.includes(key)
                  )
                )
              )};`;
              processor.magicContent.overwrite(nodeBody.start, nodeBody.end, specifiers);
            }

            const content = `\n${fileMagicContent
              .toString()
              .replace(processor.style.openTag, '')
              .replace(processor.style.closeTag, '')}`;

            if (processor.style.ast) {
              processor.magicContent.prependLeft(processor.style.ast.content.start, content);
            } else {
              importedContent += content;
            }
          } catch (err: any) {
            fs.access(nodeModulesPath, constants.F_OK, (error) => {
              if (error) {
                throw new Error(err); // not found in node_modules packages either, throw orignal error
              }
            });
          }
        }
      });
    },
  });

  if (importedContent) {
    processor.magicContent.append(
      `${processor.style.openTag}${importedContent}${processor.style.closeTag}`
    );
  }
};
