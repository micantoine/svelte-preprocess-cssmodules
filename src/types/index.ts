import { GetLocalIdent } from '../utils/getLocalIdent';

export type PluginOptions = {
  includePaths: string[];
  localIdentName: string;
  getLocalIdent: GetLocalIdent;
  strict: boolean;
}

export interface PreprocessorOptions {
  content: string;
  filename: string;
}

export interface PreprocessorResult {
  code: string;
}
