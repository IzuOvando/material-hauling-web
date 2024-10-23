import prisma from "../db";

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

  const passwordMatches = user.password === hashedPassword;
  if (!passwordMatches) return null;

  return user;
}
