export const PATTERN_MODULE = /\$(style)?\.(:?[\w\d-]*)/gm;
export const PATTERN_PATH_UNALLOWED = /[<>:"/\\|?*]/g;
export const PATTERN_STYLE = /<style(\s[^]*?)?>([^]*?)<\/style>/gi;
export const PATTERN_IMPORT = /import\s*(?:(.+)\s+from\s+)['|"](.+s?css)['|"];?/gm;

export const PATTERN_CLASSNAME = (className: string): RegExp =>
  new RegExp(`\\.(${className})\\b(?![-_])`, 'gm');
export const PATTERN_CLASS_SELECTOR = (className: string): RegExp =>
  new RegExp(`\\S*\\.(${className})\\b(?![-_])\\S*`, 'gm');
