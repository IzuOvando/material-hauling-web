import CryptoJS from 'crypto-js';

export function generateSaltAndHash(data: string) {
  const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
  const iterations = 5000;
  const keySize = 64 / 4;

  const hash = CryptoJS.PBKDF2(data, salt, {
    keySize: keySize,
    iterations: iterations,
    hasher: CryptoJS.algo.SHA512,
  }).toString(CryptoJS.enc.Hex);

  return { salt, hash };
}
