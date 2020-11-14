import { CSSModuleList } from '../types';
import { PATTERN_CLASSNAME, PATTERN_CLASS_SELECTOR } from '../lib/patterns';

export type Parser = {
  content: string,
};

const parseStyle = (
  content: string,
  filename: string,
  cssModuleList: CSSModuleList
): Parser => {
  if (Object.keys(cssModuleList).length === 0) {
    return { content };
  }

  let parsedContent = content;

  Object.keys(cssModuleList).forEach((className) => {
    parsedContent = parsedContent.replace(
      PATTERN_CLASS_SELECTOR(className),
      (match) => {
        const generatedClass = match.replace(
          PATTERN_CLASSNAME(className),
          () => `.${cssModuleList[className]}`
        );

        return generatedClass.indexOf(':global(') !== -1
          ? generatedClass
          : `:global(${generatedClass})`;
      }
    );
  });

  return {
    content: parsedContent
  };
};

export default parseStyle;
