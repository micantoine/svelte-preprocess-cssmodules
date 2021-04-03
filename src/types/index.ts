import { GetLocalIdent } from '../lib';

export type PluginOptions = {
  mode: 'native' | 'mixed' | 'scoped';
  includePaths: string[];
  localIdentName: string;
  getLocalIdent: GetLocalIdent;
  strict: boolean;
};

export interface PreprocessorOptions {
  content: string;
  filename: string;
}

export interface PreprocessorResult {
  code: string;
}

export type CSSModuleList = Record<string, string>;
export type CSSModuleDirectory = Record<string, CSSModuleList>;
