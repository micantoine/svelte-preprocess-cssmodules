import path from 'path';
import fs from 'fs';
import matchAll from 'string.prototype.matchall';
import fromEntries from 'object.fromentries';
import { PluginOptions, CSSModuleList } from '../types';
import {
  PATTERN_CLASSNAME,
  PATTERN_CLASS_DIRECTIVE,
  PATTERN_CLASS_SELECTOR,
  PATTERN_IMPORT,
  PATTERN_MODULE,
  PATTERN_STYLE,
} from '../lib/patterns';
import { camelCase, createClassName } from '../lib';

/**
 * Append imported stylesheet content to the component
 * @param markupContent the component markup content
 * @param styleContent the component style content
 * @param importedStylesheets the list of imported stylesheet content
 * @param fileType fileType being imported
 * @return the updated markup of the component
 */
const appendStylesheetToMarkup = (
  markupContent: string,
  styleContent: string,
  importedStylesheets: string[],
  fileType: string
): string => {
  if (styleContent) {
    let updatedStyle = styleContent;
    // update style with imports stylesheets
    if (importedStylesheets.length) {
      updatedStyle = styleContent.replace(
        PATTERN_STYLE,
        (_match, attributes, stylesheetContent) => {
          const styleAttribute = fileType !== 'css' ? ` lang="${fileType}"` : attributes;
          return `<style${styleAttribute || ''}>\n${importedStylesheets.join(
            '\n'
          )}${stylesheetContent}</style>`;
        }
      );
    }
    return markupContent.replace(PATTERN_STYLE, updatedStyle);
  }

  if (importedStylesheets.length) {
    const styleAttribute = fileType !== 'css' ? ` lang="${fileType}"` : '';
    return `${markupContent}\n<style${styleAttribute}>\n${importedStylesheets.join(
      '\n'
    )}\n</style>`;
  }

  return markupContent;
};

type Parser = {
  content: string;
  cssModuleList: CSSModuleList;
};

/**
 * Parse Markup
 * @param content the markup content
 * @param filename the resource filename
 * @param pluginOptions preprocess-cssmodules options
 */
const parseMarkup = async (
  content: string,
  filename: string,
  pluginOptions: PluginOptions
): Promise<Parser> => {
  let parsedContent: string = content;
  const cssModuleList: CSSModuleList = {};

  const styles = content.match(PATTERN_STYLE);
  const styleContent = styles && styles.length ? styles[0] : null;
  const importedStyleContent: string[] = [];
  let importedStyleType = 'css';

  // go through imports
  if (content.search(PATTERN_IMPORT) !== -1) {
    const directives = new Map();

    parsedContent = parsedContent.replace(
      PATTERN_IMPORT,
      (_match, varName, relativePath, extension) => {
        const absolutePath = path.resolve(path.dirname(filename), relativePath);
        try {
          const fileContent = fs.readFileSync(absolutePath, 'utf8');
          importedStyleContent.push(fileContent);

          if (!varName) {
            return '';
          }

          const classlist = new Map();
          Array.from(matchAll(fileContent, PATTERN_CLASS_SELECTOR)).forEach((matchItem) => {
            // set array from exported className
            const destructuredImportRegex = /\{([\w,\s]+)\}/gm;
            const isDestructuredImport: boolean = varName.search(destructuredImportRegex) !== -1;
            let destructuredImportNames: string[] = [];
            if (isDestructuredImport) {
              const destructuredImport: string = Object.values(
                fromEntries(matchAll(varName, destructuredImportRegex))
              )[0].toString();
              if (destructuredImport) {
                destructuredImportNames = destructuredImport.replace(/\s/g, '').split(',');
              }
            }

            const camelCaseClassName = camelCase(matchItem.groups.className);

            if (
              !classlist.has(camelCaseClassName) &&
              (!isDestructuredImport ||
                (isDestructuredImport && destructuredImportNames.includes(camelCaseClassName)))
            ) {
              const interpolatedName = createClassName(
                filename,
                content,
                fileContent,
                matchItem.groups.className,
                pluginOptions
              );
              classlist.set(camelCaseClassName, interpolatedName);
              cssModuleList[matchItem.groups.className] = interpolatedName;

              // consider use with class directive
              const directiveClass = isDestructuredImport
                ? camelCaseClassName
                : `${varName}.${camelCaseClassName}`;
              if (PATTERN_CLASS_DIRECTIVE(directiveClass).test(parsedContent)) {
                directives.set(directiveClass, interpolatedName);
              }
            }
          });

          if (extension !== 'css') {
            importedStyleType = extension;
          }

          return `const ${varName} = ${JSON.stringify(fromEntries(classlist))};`;
        } catch (err) {
          throw new Error(err);
        }
      }
    );

    // directives replacement (as dynamic values cannot be used)
    if (directives.size) {
      await new Promise((resolve) => {
        let count = 0;
        directives.forEach((value, key) => {
          parsedContent = parsedContent.replace(PATTERN_CLASS_DIRECTIVE(key), (directiveMatch) =>
            directiveMatch.replace(key, value)
          );
          count += 1;
          if (count === directives.size) {
            resolve(true);
          }
        });
      });
    }
  }

  // go through module $style syntax
  if (content.search(PATTERN_MODULE) !== -1) {
    parsedContent = parsedContent.replace(PATTERN_MODULE, (match, key, className) => {
      let replacement = '';
      if (!className.length) {
        throw new Error(
          `Invalid class name in file ${filename}.\n` +
            'This usually happens when using dynamic classes with svelte-preprocess-cssmodules.'
        );
      }

      if (!PATTERN_CLASSNAME(className).test(`.${className}`)) {
        throw new Error(`Classname "${className}" in file ${filename} is not valid`);
      }

      if (!PATTERN_CLASSNAME(className).test(styleContent)) {
        if (pluginOptions.strict) {
          throw new Error(`Classname "${className}" was not found in declared ${filename} <style>`);
        }
        // In non-strict mode, we just remove $style classes that don't have a definition
        return replacement;
      }

      if (styleContent) {
        const interpolatedName = createClassName(
          filename,
          content,
          styleContent,
          className,
          pluginOptions
        );

        cssModuleList[className] = interpolatedName;
        replacement = interpolatedName;
      }

      return replacement;
    });
  }

  // Append imported stylesheet to markup
  parsedContent = appendStylesheetToMarkup(
    parsedContent,
    styleContent,
    importedStyleContent,
    importedStyleType
  );

  return {
    content: parsedContent,
    cssModuleList,
  };
};

export default parseMarkup;
