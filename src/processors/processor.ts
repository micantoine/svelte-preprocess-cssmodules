import MagicString from 'magic-string';
import type { AST } from 'svelte/compiler';
import { CSSModuleList, PluginOptions } from '../types';
import {
  camelCase,
  createClassName,
  generateName,
  hasModuleAttribute,
  hasModuleImports,
} from '../lib';
import { parseImportDeclaration, parseTemplate, parseRune } from '../parsers';

export default class Processor {
  public filename: string;
  public options: PluginOptions;
  public rawContent: string;
  public cssModuleList: CSSModuleList = {};
  public cssVarList: CSSModuleList = {};
  public cssKeyframeList: CSSModuleList = {};
  public cssAnimationProperties: AST.CSS.Declaration[] = [];
  public importedCssModuleList: CSSModuleList = {};

  public ast: AST.Root;
  public style: {
    ast?: AST.Root['css'];
    openTag: string;
    closeTag: string;
  };

  public magicContent: MagicString;

  public styleParser: (param: Processor) => void;
  public isParsingImports = false;

  constructor(
    ast: AST.Root,
    content: string,
    filename: string,
    options: PluginOptions,
    parser: (param: Processor) => void
  ) {
    this.filename = filename;
    this.options = options;
    this.rawContent = content;
    this.ast = ast;
    this.magicContent = new MagicString(content);
    this.styleParser = parser.bind(this);

    this.style = {
      ast: ast.css,
      openTag: ast.css ? content.substring(ast.css.start, ast.css.content.start) : '<style module>',
      closeTag: '</style>',
    };
  }

  /**
   * Create CssModule classname
   * @param name The raw classname
   * @returns The generated module classname
   */
  public createModuleClassname = (name: string): string => {
    const generatedClassName = createClassName(
      this.filename,
      this.rawContent,
      this.ast.css?.content.styles ?? '',
      name,
      this.options
    );

    return generatedClassName;
  };

  /**
   * Add CssModule data to list
   * @param name The raw classname
   * @param value The generated module classname
   */
  public addModule = (name: string, value: string): void => {
    if (this.isParsingImports) {
      this.importedCssModuleList[camelCase(name)] = value;
    }
    this.cssModuleList[name] = value;
  };

  /**
   * Parse component
   * @returns The CssModule updated component
   */
  public parse = (): string => {
    if (
      this.options.parseStyleTag &&
      (hasModuleAttribute(this.ast) || (this.options.useAsDefaultScoping && this.ast.css))
    ) {
      this.isParsingImports = false;
      this.styleParser(this);
    }

    if (this.options.parseExternalStylesheet && hasModuleImports(this.rawContent)) {
      this.isParsingImports = true;
      parseImportDeclaration(this);
    }

    if(this.options.rune) {
      parseRune(this);
    }

    if (Object.keys(this.cssModuleList).length > 0 || Object.keys(this.cssVarList).length > 0) {
      parseTemplate(this);
    }

    return this.magicContent.toString();
  };

  /**
   * Parse css dynamic variables bound to js bind()
   * @param node The ast "Selector" node to parse
   */
  public parseBoundVariables = (node: AST.CSS.Block): void => {
    const bindedVariableNodes = (node.children.filter(
      (item) => item.type === 'Declaration' && item.value.includes('bind(')
    ) ?? []) as AST.CSS.Declaration[];

    if (bindedVariableNodes.length > 0) {
      bindedVariableNodes.forEach((item) => {
        const name = item.value.replace(/'|"|bind\(|\)/g, '');
        const varName = name.replace(/\./, '-');

        const generatedVarName = generateName(
          this.filename,
          this.ast.css?.content.styles ?? '',
          varName,
          {
            hashSeeder: ['style', 'filepath'],
            localIdentName: `[local]-${this.options.cssVariableHash}`,
          }
        );
        const bindStart = item.end - item.value.length;
        this.magicContent.overwrite(bindStart, item.end, `var(--${generatedVarName})`);
        this.cssVarList[name] = generatedVarName;
      });
    }
  };

  /**
   * Parse keyframes
   * @param node The ast "Selector" node to parse
   */
  public parseKeyframes = (node: AST.CSS.Atrule): void => {
    if (node.prelude.indexOf('-global-') === -1) {
      const animationName = this.createModuleClassname(node.prelude);
      if (node.block?.end) {
        this.magicContent.overwrite(
          node.start,
          node.block.start - 1,
          `@keyframes -global-${animationName}`
        );
        this.cssKeyframeList[node.prelude] = animationName;
      }
    }
  };

  /**
   * Parse pseudo selector :local()
   * @param node The ast "Selector" node to parse
   */
  public parseClassSelectors = (node: AST.CSS.SimpleSelector): void => {
    if (node.type === 'ClassSelector') {
      const generatedClassName = this.createModuleClassname(node.name);
      this.addModule(node.name, generatedClassName);
      this.magicContent.overwrite(node.start, node.end, `.${generatedClassName}`);
    }
  };

  /**
   * Parse pseudo selector :local()
   * @param node The ast "Selector" node to parse
   */
  public parsePseudoLocalSelectors = (node: AST.CSS.SimpleSelector): void => {
    if (node.type === 'PseudoClassSelector' && node.name === 'local') {
      this.magicContent.remove(node.start, node.start + `:local(`.length);
      this.magicContent.remove(node.end - 1, node.end);
    }
  };

  /**
   * Store animation properties
   * @param node The ast "Selector" node to parse
   */
  public storeAnimationProperties = (node: AST.CSS.Block): void => {
    const animationNodes = (node.children.filter(
      (item) =>
        item.type === 'Declaration' && ['animation', 'animation-name'].includes(item.property)
    ) ?? []) as AST.CSS.Declaration[];

    if (animationNodes.length > 0) {
      this.cssAnimationProperties.push(...animationNodes);
    }
  };

  /**
   * Overwrite animation properties
   * apply module when required
   */
  public overwriteAnimationProperties = (): void => {
    this.cssAnimationProperties.forEach((item) => {
      Object.keys(this.cssKeyframeList).forEach((key) => {
        const index = item.value.indexOf(key);
        if (index > -1) {
          const keyStart = item.end - item.value.length + index;
          const keyEnd = keyStart + key.length;
          this.magicContent.overwrite(keyStart, keyEnd, this.cssKeyframeList[key]);
        }
      });
    });
  };
}
