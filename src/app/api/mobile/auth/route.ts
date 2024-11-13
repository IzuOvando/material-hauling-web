import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/db/validateUser';
import { generateSaltAndHash } from '@/utils/crypto/cryptoUtils';
import { TokenAuthenticator } from '@/auth/TokenAuthenticator';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Se requiere un nombre de usuario y una contraseña' }, { status: 400 });
    }

    const user = await validateUser(username, password);
    if (!user) {
      return NextResponse.json({ message: 'Nombre de usuario o contraseña inválidos' }, { status: 401 });
    }

    const concatenated = `${username}:${user.password}`;
    const { salt, hash } = generateSaltAndHash(concatenated);

    const tokens = TokenAuthenticator.authenticate(username, user.rol);

    return NextResponse.json(
      {
        authorization: {
          salt,
          hash,
        },
        tokens,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Algo salió mal' }, { status: 500 });
  }
}

