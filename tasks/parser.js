/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { Parser } = require('acorn');
const { walk } = require('svelte/compiler');
const MagicString = require('magic-string');

const parseDir = (dir) => {
  fs.readdir(dir, (err, children) => {
    if (err) return
    children.forEach((child) => {
      const pathname = `${dir}/${child}`;
      fs.lstat(pathname, (err, stats) => {
        if (err) return
        if (stats.isDirectory()) {
          parseDir(pathname);
        }
        if (stats.isFile()) {
          fs.readFile(pathname, 'utf-8', (err, content) => {
            if (err) return
            const ast = Parser.parse(content, {
              ecmaVersion: 'latest',
              sourceType: 'module'
            });
            const magicContent = new MagicString(content);
            walk(ast, {
              enter(node) {
                if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
                  const filename = path.resolve(path.dirname(pathname), `${node.source.value}.js`);
                  const dirIndex = path.resolve(path.dirname(pathname), `${node.source.value}/index.js`);
                  if (fs.existsSync(filename)) {
                    magicContent.prependLeft(node.source.end - 1, '.mjs');
                  } else if (fs.existsSync(dirIndex)) {
                    magicContent.prependLeft(node.source.end - 1, '/index.mjs');
                  }
                } else if (
                  node.type === 'ExportDefaultDeclaration'
                  && node.declaration?.left?.type === 'MemberExpression'
                  && node.declaration.left.object.name === 'module'
                  && node.declaration.left.property.name === 'exports'
                ) {
                  magicContent.remove(node.declaration.left.start, node.declaration.right.start);
                }
              }
            });
            const mjsPathname = pathname.replace('/esm', '').replace('.js', '.mjs');
            fs.writeFile(mjsPathname, magicContent.toString(), (err) => {
              if (err) throw err;
            });
          });
        }
      });
    });
  });
}

parseDir('./dist/esm');
