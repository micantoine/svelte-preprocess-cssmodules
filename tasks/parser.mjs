/* eslint-disable no-shadow */
import { readdir, lstat, readFile, existsSync, writeFile } from 'fs';
import { resolve, dirname } from 'path';
import { Parser } from 'acorn';
import { walk } from 'estree-walker';
import MagicString from 'magic-string';

const parseDir = (dir) => {
  readdir(dir, (err, children) => {
    if (err) return
    children.forEach((child) => {
      const pathname = `${dir}/${child}`;
      lstat(pathname, (err, stats) => {
        if (err) return
        if (stats.isDirectory()) {
          parseDir(pathname);
        }
        if (stats.isFile()) {
          readFile(pathname, 'utf-8', (err, content) => {
            if (err) return
            const ast = Parser.parse(content, {
              ecmaVersion: 'latest',
              sourceType: 'module'
            });
            const magicContent = new MagicString(content);
            walk(ast, {
              enter(node) {
                if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
                  const filename = resolve(dirname(pathname), `${node.source.value}.js`);
                  const dirIndex = resolve(dirname(pathname), `${node.source.value}/index.js`);
                  if (existsSync(filename)) {
                    magicContent.prependLeft(node.source.end - 1, '.mjs');
                  } else if (existsSync(dirIndex)) {
                    magicContent.prependLeft(node.source.end - 1, '/index.mjs');
                  }
                } else if (
                  node.type === 'ExportDefaultDeclaration'
                  && node.declaration.type === 'AssignmentExpression'
                  && node.declaration.right.type === 'AssignmentExpression'
                  && node.declaration.right.left.object.name === 'module'
                  && node.declaration.right.left.property.name === 'exports'
                ) {
                  magicContent.remove(node.declaration.left.start, node.declaration.right.right.start);
                }
                // } else if (
                //   node.type === 'ExportDefaultDeclaration'
                //   && node.declaration?.left?.type === 'MemberExpression'
                //   && node.declaration.left.object.name === 'module'
                //   && node.declaration.left.property.name === 'exports'
                // ) {
                //   magicContent.remove(node.declaration.left.start, node.declaration.right.start);
                // }
              }
            });
            const mjsPathname = pathname.replace('/esm', '').replace('.js', '.mjs');
            writeFile(mjsPathname, magicContent.toString(), (err) => {
              if (err) throw err;
            });
          });
        }
      });
    });
  });
}

parseDir('./dist/esm');
