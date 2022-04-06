import type { GetLocalIdent } from '../lib';

export type PluginOptions = {
  cssVariableHash: string;
  getLocalIdent: GetLocalIdent;
  hashSeeder: Array<'style' | 'filepath' | 'classname'>;
  includeAttributes: string[];
  includePaths: string[];
  localIdentName: string;
  mode: 'native' | 'mixed' | 'scoped';
  parseExternalStylesheet: boolean;
  parseStyleTag: boolean;
  useAsDefaultScoping: boolean;
};

export type CSSModuleList = Record<string, string>;
export type CSSModuleDirectory = Record<string, CSSModuleList>;
