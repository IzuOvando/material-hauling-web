import crypto from 'crypto';

export function generateSaltAndHash(data: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 300000;
  const keyLength = 64;
  const digest = 'sha512';

  const hash = crypto.pbkdf2Sync(data, salt, iterations, keyLength, digest).toString('hex');

  return { salt, hash };
}
