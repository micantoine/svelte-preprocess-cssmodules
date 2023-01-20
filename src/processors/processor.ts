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
  public cssKeyframeList: CSSModuleList = {};
  public cssAnimationProperties: TemplateNode[] = [];
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

  /**
   * Parse css dynamic variables bound to js bind()
   * @param node The ast "Selector" node to parse
   */
  public parseBoundVariables = (node: TemplateNode): void => {
    const bindedVariableNodes =
      node.children?.filter(
        (item) => item.type === 'Function' && item.name === 'bind' && node.children?.length
      ) ?? [];

    if (bindedVariableNodes.length > 0) {
      bindedVariableNodes.forEach((item) => {
        if (item.children) {
          const child = item.children[0];
          const name = child.name ?? child.value.replace(/'|"/g, '');
          const varName = child.type === 'String' ? name.replace(/\./, '-') : name;
          const generatedVarName = generateName(
            this.filename,
            this.ast.css.content.styles,
            varName,
            {
              hashSeeder: ['style', 'filepath'],
              localIdentName: `[local]-${this.options.cssVariableHash}`,
            }
          );
          this.magicContent.overwrite(item.start, item.end, `var(--${generatedVarName})`);
          this.cssVarList[name] = generatedVarName;
        }
      });
    }
  };

  /**
   * Parse keyframes
   * @param node The ast "Selector" node to parse
   */
  public parseKeyframes = (node: TemplateNode): void => {
    const rulePrelude = node.prelude.children[0];
    if (rulePrelude.name.indexOf('-global-') === -1) {
      const animationName = this.createModuleClassname(rulePrelude.name);
      this.magicContent.overwrite(rulePrelude.start, rulePrelude.end, `-global-${animationName}`);
      this.cssKeyframeList[rulePrelude.name] = animationName;
    }
  };

  /**
   * Parse pseudo selector :local()
   * @param node The ast "Selector" node to parse
   */
  public parsePseudoLocalSelectors = (node: TemplateNode): void => {
    if (node.type === 'PseudoClassSelector' && node.name === 'local') {
      this.magicContent.remove(node.start, node.start + `:local(`.length);
      this.magicContent.remove(node.end - 1, node.end);
    }
  };

  /**
   * Store animation properties
   * @param node The ast "Selector" node to parse
   */
  public storeAnimationProperties = (node: TemplateNode): void => {
    if (node.type === 'Declaration' && node.property === 'animation') {
      let names = 0;
      let properties = 0;
      node.value.children.forEach((item: TemplateNode) => {
        if (item.type === 'Identifier' && properties === names) {
          names += 1;
          this.cssAnimationProperties.push(item);
        }
        if (item.type === 'Operator' && item.value === ',') {
          properties += 1;
        }
      });
    }
  };

  /**
   * Overwrite animation properties
   * apply module when required
   */
  public overwriteAnimationProperties = (): void => {
    this.cssAnimationProperties.forEach((item) => {
      if (item.name in this.cssKeyframeList) {
        this.magicContent.overwrite(item.start, item.end, this.cssKeyframeList[item.name]);
      }
    });
  };
}
