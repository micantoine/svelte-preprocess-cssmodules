/* eslint-disable no-param-reassign */
import path from 'path';
import fs, { constants } from 'fs';
import MagicString from 'magic-string';
import { parse } from 'svelte/compiler';
import { walk } from 'estree-walker';
import type { TemplateNode } from 'svelte/types/compiler/interfaces.d';
import type Processor from '../processors/processor';

/**
 * Parse CssModules Imports
 */
export default (processor: Processor): void => {
  const ast = (processor.ast as unknown) as TemplateNode;
  const backup = {
    ast: processor.ast,
    magicContent: processor.magicContent,
  };

  let importedContent = '';

  walk(ast, {
    enter(baseNode) {
      const node = baseNode as TemplateNode;
      if (node.type === 'Style' || node.type === 'Fragment') {
        this.skip();
      }
      if (
        node.type === 'ImportDeclaration' &&
        node.source.value.search(/\.module\.s?css$/) !== -1
      ) {
        const absolutePath = path.resolve(path.dirname(processor.filename), node.source.value);
        const nodeModulesPath = path.resolve(`${path.resolve()}/node_modules`, node.source.value);

        try {
          processor.importedCssModuleList = {};
          const fileContent = fs.readFileSync(absolutePath, 'utf8');
          const fileStyle = `${processor.style.openTag}${fileContent}${processor.style.closeTag}`;

          let fileMagicContent = new MagicString(fileStyle);
          processor.ast = parse(fileStyle, { filename: absolutePath });
          processor.magicContent = fileMagicContent;

          processor.styleParser(processor);

          fileMagicContent = processor.magicContent;
          processor.ast = backup.ast;
          processor.magicContent = backup.magicContent;

          if (node.specifiers.length === 0) {
            processor.magicContent.remove(node.start, node.end);
          } else if (node.specifiers[0].type === 'ImportDefaultSpecifier') {
            const specifiers = `const ${node.specifiers[0].local.name} = ${JSON.stringify(
              processor.importedCssModuleList
            )};`;
            processor.magicContent.overwrite(node.start, node.end, specifiers);
          } else {
            const specifierNames = node.specifiers.map((item: TemplateNode) => {
              return item.local.name;
            });
            const specifiers = `const { ${specifierNames.join(', ')} } = ${JSON.stringify(
              Object.fromEntries(
                Object.entries(processor.importedCssModuleList).filter(([key]) =>
                  specifierNames.includes(key)
                )
              )
            )};`;
            processor.magicContent.overwrite(node.start, node.end, specifiers);
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
    },
  });

  if (importedContent) {
    processor.magicContent.append(
      `${processor.style.openTag}${importedContent}${processor.style.closeTag}`
    );
  }
};
