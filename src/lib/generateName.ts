import path from 'path';
import getHashDigest from './getHashDijest';
import type { PluginOptions } from '../types';

const PATTERN_PATH_UNALLOWED = /[<>:"/\\|?*]/g;

/**
 * interpolateName, adjusted version of loader-utils/interpolateName
 * @param resourcePath The file resourcePath
 * @param localName The local name/rules to replace
 * @param content The content to base the hash on
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interpolateName(resourcePath: string, localName: any, content: any) {
  const filename = localName || '[hash].[ext]';

  let ext = 'svelte';
  let basename = 'file';
  let directory = '';
  let folder = '';

  const parsed = path.parse(resourcePath);
  let composedResourcePath = resourcePath;

  if (parsed.ext) {
    ext = parsed.ext.substr(1);
  }

  if (parsed.dir) {
    basename = parsed.name;
    composedResourcePath = parsed.dir + path.sep;
  }
  directory = composedResourcePath.replace(/\\/g, '/').replace(/\.\.(\/)?/g, '_$1');

  if (directory.length === 1) {
    directory = '';
  } else if (directory.length > 1) {
    folder = path.basename(directory);
  }

  let url = filename;

  if (content) {
    url = url.replace(
      /\[(?:([^:\]]+):)?(?:hash|contenthash)(?::([a-z]+\d*))?(?::(\d+))?\]/gi,
      (all: never, hashType: string, digestType: string, maxLength: never) =>
        getHashDigest(content, hashType, digestType, parseInt(maxLength, 10))
    );
  }

  return url
    .replace(/\[ext\]/gi, () => ext)
    .replace(/\[name\]/gi, () => basename)
    .replace(/\[path\]/gi, () => directory)
    .replace(/\[folder\]/gi, () => folder);
}

/**
 * generateName
 * @param resourcePath The file resourcePath
 * @param style The style content
 * @param className The cssModules className
 * @param localIdentName The localIdentName rule
 */
export function generateName(
  resourcePath: string,
  style: string,
  className: string,
  pluginOptions: Pick<PluginOptions, 'localIdentName' | 'hashSeeder'>
): string {
  const filePath = resourcePath;
  const localName = pluginOptions.localIdentName.length
    ? pluginOptions.localIdentName.replace(/\[local\]/gi, () => className)
    : className;

  const hashSeeder = pluginOptions.hashSeeder
    .join('-')
    .replace(/style/gi, () => style)
    .replace(/filepath/gi, () => filePath)
    .replace(/classname/gi, () => className);

  let interpolatedName = interpolateName(resourcePath, localName, hashSeeder).replace(/\./g, '-');

  // replace unwanted characters from [path]
  if (PATTERN_PATH_UNALLOWED.test(interpolatedName)) {
    interpolatedName = interpolatedName.replace(PATTERN_PATH_UNALLOWED, '_');
  }

  // prevent class error when the generated classname starts from a non word charater
  if (/^(?![a-zA-Z_])/.test(interpolatedName)) {
    interpolatedName = `_${interpolatedName}`;
  }

  // prevent svelte "Unused CSS selector" warning when the generated classname ends by `-`
  if (interpolatedName.slice(-1) === '-') {
    interpolatedName = interpolatedName.slice(0, -1);
  }

  return interpolatedName;
}

/**
 * Create the interpolated name
 * @param filename tthe resource filename
 * @param markup Markup content
 * @param style Stylesheet content
 * @param className the className
 * @param pluginOptions preprocess-cssmodules options
 * @return the interpolated name
 */
export function createClassName(
  filename: string,
  markup: string,
  style: string,
  className: string,
  pluginOptions: PluginOptions
): string {
  const interpolatedName = generateName(filename, style, className, pluginOptions);
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
}
