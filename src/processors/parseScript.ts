import path from 'path';
import fs from 'fs';
import { PATTERN_CLASS_SELECTOR, PATTERN_IMPORT } from '../lib/patterns';

type Parser = {
  content: string;
};

const parseScript = (content: string, filename: string): Parser => {
  const stylesheet = [];

  const parsedContent = content.replace(PATTERN_IMPORT, (match, varName, relativePath) => {
    const absolutePath = path.resolve(path.dirname(filename), relativePath);
    try {
      const fileContent = fs.readFileSync(absolutePath, 'utf8');
      const classlist = new Map();
      Array.from(fileContent.matchAll(PATTERN_CLASS_SELECTOR)).forEach((matchItem) => {
        if (!classlist.has(matchItem.groups.className)) {
          classlist.set(matchItem.groups.className, matchItem.groups.className);
        }
      });
      stylesheet.push(fileContent);
      return `const ${varName} = ${JSON.stringify(Object.fromEntries(classlist))}`;
    } catch (err) {
      throw new Error(err);
    }
    return '';
  });

  return {
    content: parsedContent,
  };
};

export default parseScript;
