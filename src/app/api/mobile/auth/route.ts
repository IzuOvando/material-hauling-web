import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/db/validateUser';
import { generateSaltAndHash } from '@/utils/crypto/cryptoUtils';
import { TokenAuthenticator } from '@/auth/TokenAuthenticator';
import { logSecurityEvent, SecurityEventType } from '@/auth/securityLogger';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Se requiere un nombre de usuario y una contraseña' }, { status: 400 });
    }

    const user = await validateUser(username, password);
    if (!user) {
      logSecurityEvent({ type: SecurityEventType.AUTH_FAILURE, ip, resource: '/api/mobile/auth', details: { username } });
      return NextResponse.json({ message: 'Nombre de usuario o contraseña inválidos' }, { status: 401 });
    }

    const concatenated = `${username}:${password}`;
    const { salt, hash } = generateSaltAndHash(concatenated);

    const tokens = TokenAuthenticator.authenticate(username, user.rol);

    logSecurityEvent({ type: SecurityEventType.AUTH_SUCCESS, ip, userId: username, resource: '/api/mobile/auth' });

    return NextResponse.json(
      {
        authorization: {
          salt,
          hash,
        },
        tokens,
        profile: {
          role: user.rol,
          nombre: user.nombre ?? null,
          apPaterno: user.apPaterno ?? null,
          apMaterno: user.apMaterno ?? null,
          noEmpleado: user.noEmpleado ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Algo salió mal' }, { status: 500 });
  }
}
