import path from 'path';
import type { Ast } from 'svelte/types/compiler/interfaces';

/**
 * Normalize path by replacing potential backslashes to slashes
 * @param filepath The file path to normalize
 * @returns a path using forward slashes
 */
const normalizePath = (filepath: string): string =>
  path.sep === '\\' ? filepath.replace(/\\/g, '/') : filepath;

/**
 * Normalize all included paths
 * @param paths all paths to be normalized
 * @returns list of path using forward slashes
 */
export const normalizeIncludePaths = (paths: string[]): string[] =>
  paths.map((includePath) => normalizePath(path.resolve(includePath)));

/**
 * Check if a file requires processing
 * @param includePaths List of allowd paths
 * @param filename the current filename to compare with the paths
 * @returns The permission status
 */
export const isFileIncluded = (includePaths: string[], filename: string): boolean => {
  if (includePaths.length < 1) {
    return true;
  }

  return includePaths.some((includePath) => filename.startsWith(includePath));
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
