import path from 'path';
import { getHashDigest } from 'loader-utils';
import { PluginOptions } from '../types';
import { PATTERN_PATH_UNALLOWED } from './patterns';

/**
 * interpolateName, adjusted version of loader-utils/interpolateName
 * @param resourcePath The file resourcePath
 * @param localName The local name/rules to replace
 * @param content The content to use base the hash on
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
      (all: never, hashType: never, digestType: never, maxLength: never) =>
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
 * @param styles The style content
 * @param className The cssModules className
 * @param localIdentName The localIdentName rule
 */
function generateName(
  resourcePath: string,
  styles: string,
  className: string,
  localIdentName: string
): string {
  const filePath = resourcePath;
  const localName = localIdentName.length
    ? localIdentName.replace(/\[local\]/gi, () => className)
    : className;

  const content = `${styles}-${filePath}-${className}`;

  let interpolatedName = interpolateName(resourcePath, localName, content).replace(/\./g, '-');

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
function createCssModulesClassName(
  filename: string,
  markup: string,
  style: string,
  className: string,
  pluginOptions: PluginOptions
): string {
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
}

export default createCssModulesClassName;
