import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/db/validateUser';
import { generateSaltAndHash } from '@/utils/crypto/cryptoUtils';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const user = await validateUser(username, password);
    if (!user) {
      return NextResponse.json({ message: 'Invalid username/password' }, { status: 401 });
    }

    const concatenated = `${username}:${user.password}`;

    const { salt, hash } = generateSaltAndHash(concatenated);

    return NextResponse.json(
      {
        authorization: {
          salt,
          hash,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
