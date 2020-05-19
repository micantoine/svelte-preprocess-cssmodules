const path = require('path')
const { interpolateName } = require('loader-utils')

const pluginOptions = {
  includePaths: [],
  localIdentName: '[local]-[hash:base64:6]'
}

const regex = {
  module: /\$style\.(:?[\w\d-]*)/gm,
  style: /<style(\s[^]*?)?>([^]*?)<\/style>/gi
};

function generateName(resourcePath, styles, className) {
  const filePath = resourcePath
  const fileName = path.basename(filePath)
  const localName = pluginOptions.localIdentName.length
    ? pluginOptions.localIdentName.replace(/\[local\]/gi, () => className)
    : className

  const content = `${styles}-${filePath}-${fileName}-${className}`

  let interpolatedName = interpolateName({ resourcePath }, localName, { content })

  // prevent class error when the generated classname starts from a non word charater
  if (/^(?![a-zA-Z_])/.test(interpolatedName)) {
    interpolatedName = `_${interpolatedName}`
  }

  // prevent svelte "Unused CSS selector" warning when the generated classname ends by `-`
  if (interpolatedName.slice(-1) === '-') {
    interpolatedName = interpolatedName.slice(0, -1)
  }

  return interpolatedName
}

const markup = async ({ content, filename }) => {
  const code = content;

  if (pluginOptions.includePaths.length) {
    for (const includePath of pluginOptions.includePaths) {
      if (filename.indexOf(path.resolve(includePath)) === -1) {
        return { code };
      }
    }
  }

  if (!regex.module.test(content)) {
    return { code };
  }

  const styles = content.match(regex.style);
  let parsedStyles = null;

  let parsedSource = content.replace(regex.module, (match, className) => {
    let replacement = '';

    if (styles.length) {
      const classRegex = new RegExp(`\\.(${className})\\b(?![-_])`, 'gm');
      const toBeParsed = parsedStyles ? parsedStyles : styles[0];

      if (classRegex.test(toBeParsed)) {
        const interpolatedName = generateName(
          filename,
          styles[0],
          className
        );
        parsedStyles = toBeParsed.replace(
          classRegex,
          () => `:global(.${interpolatedName})`
        );
        replacement = interpolatedName;
      }
    }
    return replacement;
  });

  if (parsedStyles) {
    parsedSource = parsedSource.replace(regex.style, parsedStyles);
  }

  return {
    code: parsedSource
  }
};

module.exports = (options) => {
  for (const option in options) {
    pluginOptions[option] = options[option];
  }
  return {
    markup,
  }
};