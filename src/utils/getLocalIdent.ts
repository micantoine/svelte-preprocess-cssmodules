interface IContext {
  context: string;
  resourcePath: string;
}

interface ILocalIdentName {
  template: string;
  interpolatedName: string;
}

interface IOptions {
  markup: string;
  style: string;
}

export type GetLocalIdent = {
  (
    context: IContext,
    localIdentName: ILocalIdentName,
    localName: string,
    options: IOptions
  ): string
}

// eslint-disable-next-line max-len
export const getLocalIdent: GetLocalIdent = (_context, localIdentName) => localIdentName.interpolatedName;
