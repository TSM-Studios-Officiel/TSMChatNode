import { createCipheriv, createDecipheriv, randomBytes, generateKeyPairSync, publicEncrypt, privateDecrypt } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const keypair: { priv: string | null, pub: string | null } = {
  priv: null,
  pub: null,
}

export const sharedKey: { shar: string | null, iv: string | null } = {
  shar: null,
  iv: null,
}

/**
 * Generates a keypair used for asymmetric RSA encryption 
 * @param length The number of bits of the key
 */
export function generateKeypair(length: number) {
  if (existsSync('./data/keys/pub.pem') && existsSync('./data/keys/priv.pem')) {
    keypair.priv = readFileSync('./data/keys/priv.pem', 'utf-8');
    keypair.pub = readFileSync('./data/keys/pub.pem', 'utf-8');

    if (keypair.priv.startsWith("-----BEGIN PRIVATE KEY-----") && keypair.pub.startsWith("-----BEGIN PUBLIC KEY-----")) return;
  }

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

  writeFileSync('./data/keys/pub.pem', publicKey, 'utf-8');
  writeFileSync('./data/keys/priv.pem', privateKey, 'utf-8');

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
  if (existsSync('./data/keys/aes') && existsSync('./data/keys/aes-iv')) {
    sharedKey.shar = readFileSync('./data/keys/aes', 'hex');
    sharedKey.iv = readFileSync('./data/keys/aes-iv', 'hex');

    if (sharedKey.shar.length !== 0 && sharedKey.iv.length !== 0) return;
  }

  sharedKey.shar = randomBytes(length).toString('hex');
  sharedKey.iv = randomBytes(iv).toString('hex');

  writeFileSync('./data/keys/aes', sharedKey.shar, 'hex');
  writeFileSync('./data/keys/aes-iv', sharedKey.iv, 'hex');
}

export function rsaEncrypt(key: string, data: string): string {
  return publicEncrypt(
    key,
    Buffer.from(data),
  ).toString('hex');
}

export function rsaDecrypt(data: string): string {
  if (!keypair.priv) {
    throw new Error("No private key defined");
  }

  return privateDecrypt(
    keypair.priv,
    Buffer.from(data, 'hex'),
  ).toString('utf-8');
}

export function aesEncrypt(data: string, key?: string, iv?: string) {
  let _key = sharedKey.shar ?? "";
  let _iv = sharedKey.iv ?? "";

  if (!!key) _key = key;
  if (!!iv) _iv = iv;

  if (!_key) {
    throw new Error("No shared key defined");
  }

  if (!_iv) {
    throw new Error("No initialization vector defined");
  }

  const cipher = createCipheriv("aes-256-cbc", Buffer.from(_key, 'hex'), Buffer.from(_iv, 'hex'));
  return cipher.update(data, 'utf-8', 'hex') + cipher.final('hex');
}

export function aesDecrypt(data: string, key?: string, iv?: string) {
  let _key = sharedKey.shar ?? "";
  let _iv = sharedKey.iv ?? "";

  if (!!key) _key = key;
  if (!!iv) _iv = iv;

  if (!_key) {
    throw new Error("No shared key defined");
  }

  if (!_iv) {
    throw new Error("No initialization vector defined");
  }

  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(_key, 'hex'), Buffer.from(_iv, 'hex'));
  return decipher.update(data, 'hex', 'utf-8') + decipher.final('utf-8');
}
