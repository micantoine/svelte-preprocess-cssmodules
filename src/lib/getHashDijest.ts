import Big from 'big.js';
import { createHash } from 'crypto';

const baseEncodeTables = {
  26: 'abcdefghijklmnopqrstuvwxyz',
  32: '123456789abcdefghjkmnpqrstuvwxyz', // no 0lio
  36: '0123456789abcdefghijklmnopqrstuvwxyz',
  49: 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', // no lIO
  52: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  58: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', // no 0lIO
  62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  64: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',
};

/**
 * encodeBufferToBase, esm version of loader-utils/getHashDigest
 * @param buffer The memory buffer
 * @param base the enconding base
 */
const encodeBufferToBase = (buffer: Buffer, base: number): string => {
  const baseEncondingNumber = base as keyof typeof baseEncodeTables;
  const encodeTable = baseEncodeTables[baseEncondingNumber];
  if (!encodeTable) {
    throw new Error(`Unknown encoding base${base}`);
  }

  const readLength = buffer.length;
  Big.DP = 0;
  Big.RM = Big.DP;
  let big = new Big(0);

  for (let i = readLength - 1; i >= 0; i -= 1) {
    big = big.times(256).plus(buffer[i]);
  }

  let output = '';
  while (big.gt(0)) {
    const modulo = (big.mod(base) as unknown) as number;
    output = encodeTable[modulo] + output;
    big = big.div(base);
  }

  Big.DP = 20;
  Big.RM = 1;

  return output;
};

/**
 * getHashDigest, esm version of loader-utils/getHashDigest
 * @param buffer The memory buffer
 * @param hashType The hashtype to use
 * @param digestType The encoding type to use
 */
const getHashDigest = (
  buffer: Buffer,
  hashType: string,
  digestType: string,
  maxLength = 9999
): string => {
  const hash = createHash(hashType || 'md5');

  hash.update(buffer);

  if (
    digestType === 'base26' ||
    digestType === 'base32' ||
    digestType === 'base36' ||
    digestType === 'base49' ||
    digestType === 'base52' ||
    digestType === 'base58' ||
    digestType === 'base62' ||
    digestType === 'base64'
  ) {
    return encodeBufferToBase(hash.digest(), parseInt(digestType.substr(4), 10)).substr(
      0,
      maxLength
    );
  }
  const encoding = (digestType as 'latin1') || 'hex';
  return hash.digest(encoding).substr(0, maxLength);
};

export default getHashDigest;
