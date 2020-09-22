const path = require('path');
const cssesc = require('cssesc');
const { interpolateName } = require('loader-utils');

const pluginOptions = {
  includePaths: [],
  localIdentName: '[local]-[hash:base64:6]',
  getLocalIdent: getLocalIdent,
};

const regex = {
  module: /\$(style)?\.(:?[\w\d-]*)/gm,
  style: /<style(\s[^]*?)?>([^]*?)<\/style>/gi,
  pathUnallowed: /[<>:"/\\|?*]/g,
  class: (className) => {
    return new RegExp(`\\.(${className})\\b(?![-_])`, 'gm')
  }
};

let moduleClasses = {};

function getLocalIdent(context, localIdentName, localName, options) {
  return localIdentName.interpolatedName;
}

function generateName(resourcePath, styles, className) {
  const filePath = resourcePath;
  const localName = pluginOptions.localIdentName.length
    ? pluginOptions.localIdentName.replace(/\[local\]/gi, () => className)
    : className;

  const content = `${styles}-${filePath}-${className}`;

  let interpolatedName = cssesc(
    interpolateName({ resourcePath }, localName, { content })
    .replace(/\./g, '-')
  );
  
  // replace unwanted characters from [path]
  if (regex.pathUnallowed.test(interpolatedName)) {
    interpolatedName = interpolatedName.replace(regex.pathUnallowed, '_');
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
  moduleClasses[filename] = {};

  return { code: content.replace(regex.module, (match, key, className) => {
    let replacement = '';
    if (styles.length) {
      if (regex.class(className).test(styles[0])) {
        const interpolatedName = generateName(
          filename,
          styles[0],
          className
        );

        const customInterpolatedName = pluginOptions.getLocalIdent(
          {
            context: path.dirname(filename),
            resourcePath :filename,
          },
          {
            interpolatedName,
            template: pluginOptions.localIdentName,
          },
          className,
          {
            markup: code,
            style: styles[0],
          }
        );

        moduleClasses[filename][className] = customInterpolatedName;
        replacement = customInterpolatedName;
      }
    }
    return replacement;
  })};
};

const style = async ({ content, filename }) => {
  let code = content;

  if (!moduleClasses.hasOwnProperty(filename)) {
    return { code };
  }
  
  const classes = moduleClasses[filename];

  if (Object.keys(classes).length === 0) {
    return { code };
  }

  for (const className in classes) {
    code = code.replace(
      regex.class(className),
      () => `:global(.${classes[className]})`
    );
  }

  return { code };
};

module.exports = (options) => {
  for (const option in options) {
    pluginOptions[option] = options[option];
  }
  return {
    markup,
    style,
  }
};