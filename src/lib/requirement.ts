import path from 'path';
import type { Ast } from 'svelte/types/compiler/interfaces.d';

/**
 * Check if a file requires processing
 * @param includePaths List of allowd paths
 * @param filename the current filename to compare with the paths
 * @returns The permission status
 */
export const isFileIncluded = async (
  includePaths: string[],
  filename: string
): Promise<boolean> => {
  if (includePaths.length < 1) {
    return true;
  }

  const isIncluded: boolean = await new Promise((resolve): void => {
    includePaths.forEach((includePath, index): void => {
      if (filename.indexOf(path.resolve(includePath)) !== -1) {
        resolve(true);
      }
      if (index === includePaths.length - 1) {
        resolve(false);
      }
    });
  });

  return isIncluded;
};

/**
 * Check if a component is importing external module stylesheets
 * @param content The component content
 * @returns The status
 */
export const hasModuleImports = (content: string): boolean => {
  const pattern = /(?<!\/\/\s*)import\s*(?:(.+)\s+from\s+)?['|"](.+?(module\.s?css))['|"];?/gm;
  return content.search(pattern) !== -1;
};

/**
 * Check if a component style demands CSS Modules
 * @param ast the component content tree
 * @returns The status
 */
export const hasModuleAttribute = (ast: Ast): boolean => {
  const moduleAttribute = ast?.css?.attributes.find((item) => item.name === 'module');
  return moduleAttribute !== undefined;
};
