import { createCipheriv, createDecipheriv, randomBytes, generateKeyPairSync, publicEncrypt, privateDecrypt } from 'node:crypto';

export const keypair: { priv: string | null, pub: string | null } = {
  priv: null,
  pub: null,
}

export const sharedKey: { shar: Buffer | null, iv: Buffer | null } = {
  shar: null,
  iv: null,
}

/**
 * Generates a keypair used for asymmetric RSA encryption 
 * @param length The number of bits of the key
 */
export function generateKeypair(length: number) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: length,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  keypair.priv = privateKey;
  keypair.pub = publicKey;
}

/**
 * Generates a key used for symmetric AES encryption
 *
 * @export
 * @param {number} length The number of bytes of the key
 * @param {number?} iv The number of bytes of the IV, by default 16.
 */
export function generateSharedKey(length: number, iv: number = 16) {
  sharedKey.shar = randomBytes(length);
  sharedKey.iv = randomBytes(iv);
}

export function rsaEncrypt(key: string, data: string) {
  return publicEncrypt(
    key,
    Buffer.from(data),
  ).toString('hex');
}

export function rsaDecrypt(data: string) {
  if (!keypair.priv) {
    throw new Error("No private key defined");
  }

  return privateDecrypt(
    keypair.priv,
    data,
  ).toString('utf-8');
}

export function aesEncrypt(data: string) {
  if (!sharedKey.shar) {
    throw new Error("No shared key defined");
  }

  if (!sharedKey.iv) {
    throw new Error("No initialization vector defined");
  }

  const cipher = createCipheriv("aes-256-ccm", sharedKey.shar, sharedKey.iv);
  return cipher.update(data, 'utf-8', 'hex') + cipher.final('hex');
}

export function aesDecrypt(data: string) {
  if (!sharedKey.shar) {
    throw new Error("No shared key defined");
  }

  if (!sharedKey.iv) {
    throw new Error("No initialization vector defined");
  }

  const decipher = createDecipheriv("aes-256-ccm", sharedKey.shar, sharedKey.iv);
  return decipher.update(data, 'hex', 'utf-8') + decipher.final('utf8');
}