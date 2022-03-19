import MagicString from 'magic-string';
import type { Ast, Style, TemplateNode } from 'svelte/types/compiler/interfaces.d';
import { CSSModuleList, PluginOptions } from '../types';
import {
  camelCase,
  createClassName,
  generateName,
  hasModuleAttribute,
  hasModuleImports,
} from '../lib';
import { parseImportDeclaration, parseTemplate } from '../parsers';

export default class Processor {
  public filename: string;
  public options: PluginOptions;
  public rawContent: string;
  public cssModuleList: CSSModuleList = {};
  public cssVarList: CSSModuleList = {};
  public importedCssModuleList: CSSModuleList = {};

  public ast: Ast;
  public style: {
    ast: Style;
    openTag: string;
    closeTag: string;
  };

  public magicContent: MagicString;

  public styleParser: (param: Processor) => void;
  public isParsingImports = false;

  constructor(
    ast: Ast,
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
      this.ast.css.content.styles,
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
   * Parse pseudo selector :local()
   * @param node The ast "Selector" node to parse
   */
  public parseBindedVariables = (node: TemplateNode): void => {
    const bindedVariableNodes =
      node.children?.filter(
        (item) => item.type === 'Function' && item.name === 'bind' && node.children?.length
      ) ?? [];

    if (bindedVariableNodes.length > 0) {
      bindedVariableNodes.forEach((item) => {
        if (item.children) {
          const { name } = item.children[0];
          const generatedVarName = generateName(this.filename, this.ast.css.content.styles, name, {
            hashSeeder: ['style', 'filepath'],
            localIdentName: `[local]-${this.options.cssVariableHash}`,
          });
          this.magicContent.overwrite(item.start, item.end, `var(--${generatedVarName})`);
          this.cssVarList[name] = generatedVarName;
        }
      });
    }
  };

  /**
   * Parse pseudo selector :local()
   * @param node The ast "Selector" node to parse
   */
  public parsePseudoLocalSelectors = (node: TemplateNode): void => {
    const pseudoLocalSelectors =
      node.children?.filter(
        (item) => item.type === 'PseudoClassSelector' && item.name === 'local'
      ) ?? [];

    if (pseudoLocalSelectors.length > 0) {
      pseudoLocalSelectors.forEach((item) => {
        this.magicContent.remove(item.start, item.start + `:local(`.length);
        this.magicContent.remove(item.end - 1, item.end);
      });
    }
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

    if (Object.keys(this.cssModuleList).length > 0 || Object.keys(this.cssVarList).length > 0) {
      parseTemplate(this);
    }

    return this.magicContent.toString();
  };
}
