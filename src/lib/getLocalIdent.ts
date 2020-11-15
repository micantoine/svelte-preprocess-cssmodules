interface Context {
  context: string;
  resourcePath: string;
}

interface LocalIdentName {
  template: string;
  interpolatedName: string;
}

interface Options {
  markup: string;
  style: string;
}

export type GetLocalIdent = {
  (context: Context, localIdentName: LocalIdentName, localName: string, options: Options): string;
};

// eslint-disable-next-line max-len
export const getLocalIdent: GetLocalIdent = (_context, localIdentName) =>
  localIdentName.interpolatedName;
