import prisma from "../db";
import bcrypt from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 12;

export async function validateUser(username: string, hashedPassword: string) {
  const user = await prisma.user.findUnique({
    where: {
      username: username,
    },
    select: {
      username: true,
      password: true,
      rol: true,
    },
  });

  if (!user) return null;

  // Try to validate with bcrypt first (new schema)
  const isBcryptHash = user.password.startsWith("$2");
  if (isBcryptHash) {
    const passwordMatches = await bcrypt.compare(hashedPassword, user.password);
    if (!passwordMatches) return null;
    return user;
  }

  // TODO: LAZY MIGRATION - Remove this block when all users have migrated to bcrypt.
  // This code allows users with SHA256 passwords (old schema) to continue logging in.
  // On successful login, their password is migrated to bcrypt.
  // Implementation date: 2026-01-27
  // Review and remove after all active users have logged in.
  const legacyPasswordMatches = user.password === hashedPassword;
  if (legacyPasswordMatches) {
    // Migrate password to bcrypt
    const newHashedPassword = await bcrypt.hash(hashedPassword, BCRYPT_SALT_ROUNDS);
    await prisma.user.update({
      where: { username },
      data: { password: newHashedPassword },
    });
    return user;
  }
  // END LAZY MIGRATION

  return null;
}
