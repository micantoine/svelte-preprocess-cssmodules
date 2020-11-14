import cssesc from 'cssesc';
import { interpolateName } from 'loader-utils';
import { PATTERN_PATH_UNALLOWED } from './patterns';

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

  let interpolatedName = cssesc(
    interpolateName({ resourcePath }, localName, { content }).replace(/\./g, '-')
  );

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

export default generateName;
