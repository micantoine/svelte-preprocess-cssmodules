import path from 'path';

const isFileIncluded = async (includePaths: string[], filename: string): Promise<boolean> => {
  if (includePaths.length < 1) {
    return true;
  }

  const isIncluded: boolean = await new Promise((resolve): void => {
    includePaths.forEach((includePath, index): void => {
      if (filename.indexOf(path.resolve(includePath)) === -1) {
        resolve(true);
      }
      if (index === includePaths.length - 1) {
        resolve(false);
      }
    });
  });

  return isIncluded;
};

export default isFileIncluded;
