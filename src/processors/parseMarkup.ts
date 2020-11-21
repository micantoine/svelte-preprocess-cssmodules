import path from 'path';
import fs from 'fs';
import { PluginOptions, CSSModuleList } from '../types';
import {
  PATTERN_CLASSNAME,
  PATTERN_CLASS_DIRECTIVE,
  PATTERN_CLASS_SELECTOR,
  PATTERN_IMPORT,
  PATTERN_MODULE,
  PATTERN_STYLE,
} from '../lib/patterns';
import { camelCase, generateName } from '../lib';

/**
 * Create the interpolated name
 * @param filename tthe resource filename
 * @param markup Markup content
 * @param style Stylesheet content
 * @param className the className
 * @param pluginOptions preprocess-cssmodules options
 * @return the interpolated name
 */
const createInterpolatedName = (
  filename: string,
  markup: string,
  style: string,
  className: string,
  pluginOptions: PluginOptions
): string => {
  const interpolatedName = generateName(filename, style, className, pluginOptions.localIdentName);
  return pluginOptions.getLocalIdent(
    {
      context: path.dirname(filename),
      resourcePath: filename,
    },
    {
      interpolatedName,
      template: pluginOptions.localIdentName,
    },
    className,
    {
      markup,
      style,
    }
  );
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
          Array.from(fileContent.matchAll(PATTERN_CLASS_SELECTOR)).forEach((matchItem) => {
            // set array from exported className
            const destructuredImportRegex = /\{([\w,\s]+)\}/gm;
            const isDestructuredImport: boolean = varName.search(destructuredImportRegex) !== -1;
            let destructuredImportNames: string[] = [];
            if (isDestructuredImport) {
              const destructuredImport = Object.values(
                Object.fromEntries(varName.matchAll(destructuredImportRegex))
              )[0];
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
              const interpolatedName = createInterpolatedName(
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

          return `const ${varName} = ${JSON.stringify(Object.fromEntries(classlist))};`;
        } catch (err) {
          throw new Error(err);
        }
      }
    );

    // directives replacement (as dynamic values cannot be used)
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
    console.log(parsedContent);
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
        const interpolatedName = createInterpolatedName(
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

  if (styleContent) {
    let updatedStyle = styleContent;
    // update style with imports stylesheets
    if (importedStyleContent.length) {
      updatedStyle = styleContent.replace(
        PATTERN_STYLE,
        (_match, attributes, stylesheetContent) => {
          const styleAttribute =
            importedStyleType !== 'css' ? ` lang="${importedStyleType}"` : attributes;
          return `<style${styleAttribute || ''}>\n${importedStyleContent.join(
            '\n'
          )}${stylesheetContent}</style>`;
        }
      );
    }
    parsedContent = parsedContent.replace(PATTERN_STYLE, updatedStyle);
  } else if (importedStyleContent.length) {
    const styleAttribute = importedStyleType !== 'css' ? ` lang="${importedStyleType}"` : '';
    parsedContent = `${parsedContent}\n<style${styleAttribute}>\n${importedStyleContent.join(
      '\n'
    )}\n</style>`;
  }

  return {
    content: parsedContent,
    cssModuleList,
  };
};

export default parseMarkup;
