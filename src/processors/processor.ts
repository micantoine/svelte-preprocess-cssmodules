import MagicString from 'magic-string';
import type { Ast, Style } from 'svelte/types/compiler/interfaces.d';
import { CSSModuleList, PluginOptions } from '../types';
import { camelCase, createClassName, hasModuleAttribute, hasModuleImports } from '../lib';
import { parseImportDeclaration, parseTemplate } from '../parsers';

export default class Processor {
  public filename: string;
  public options: PluginOptions;
  public rawContent: string;
  public cssModuleList: CSSModuleList = {};
  public importedCssModuleList: CSSModuleList = {};

  public ast: Ast;
  public style: {
    ast: Style;
    openTag: string;
    closeTag: string;
  } = { ast: null, openTag: '<style module>', closeTag: '</style>' };

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

    if (ast.css) {
      this.style.ast = ast.css;
      this.style.openTag = content.substring(this.style.ast.start, this.style.ast.content.start);
    }
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

    this.addModule(name, generatedClassName);

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
    if (hasModuleAttribute(this.ast)) {
      this.isParsingImports = false;
      this.styleParser(this);
    }

    if (hasModuleImports(this.rawContent)) {
      this.isParsingImports = true;
      parseImportDeclaration(this);
    }

    if (Object.keys(this.cssModuleList).length > 0) {
      parseTemplate(this);
    }

    return this.magicContent.toString();
  };
}
