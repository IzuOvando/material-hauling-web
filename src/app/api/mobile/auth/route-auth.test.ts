/**
 * @jest-environment node
 */

import { POST } from './route';
import { validateUser } from '@/lib/db/validateUser';
import { generateSaltAndHash } from '@/utils/crypto/cryptoUtils';
import { TokenAuthenticator } from '@/auth/TokenAuthenticator';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db/validateUser');
jest.mock('@/utils/crypto/cryptoUtils');
jest.mock('@/auth/TokenAuthenticator', () => ({
  TokenAuthenticator: { authenticate: jest.fn() },
}));
jest.mock('@/auth/securityLogger', () => ({
  ...jest.requireActual('@/auth/securityLogger'),
  logSecurityEvent: jest.fn(),
}));

function buildRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/mobile/auth', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /mobile/auth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if username or password is missing', async () => {
    const response = await POST(buildRequest({ username: '', password: '' }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toBe('Se requiere un nombre de usuario y una contraseña');
    expect(validateUser).not.toHaveBeenCalled();
  });

  it('returns 401 if user is not found or password is invalid', async () => {
    (validateUser as jest.Mock).mockResolvedValue(null);

    const response = await POST(buildRequest({ username: 'testuser', password: 'wrongpassword' }));
    const json = await response.json();

    expect(validateUser).toHaveBeenCalledWith('testuser', 'wrongpassword');
    expect(response.status).toBe(401);
    expect(json.message).toBe('Nombre de usuario o contraseña inválidos');
  });

  it('returns 201 with salt/hash of the submitted credentials, tokens and profile', async () => {
    (validateUser as jest.Mock).mockResolvedValue({
      username: 'testuser',
      rol: 'user',
      nombre: 'Juan',
      apPaterno: null,
      apMaterno: null,
      noEmpleado: 'E-1',
    });
    (generateSaltAndHash as jest.Mock).mockReturnValue({ salt: 'randomsalt', hash: 'randomhash' });
    (TokenAuthenticator.authenticate as jest.Mock).mockReturnValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const response = await POST(buildRequest({ username: 'testuser', password: 'validpassword' }));
    const json = await response.json();

    expect(generateSaltAndHash).toHaveBeenCalledWith('testuser:validpassword');
    expect(TokenAuthenticator.authenticate).toHaveBeenCalledWith('testuser', 'user');
    expect(response.status).toBe(201);
    expect(json.authorization).toEqual({ salt: 'randomsalt', hash: 'randomhash' });
    expect(json.tokens).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    expect(json.profile).toEqual({
      role: 'user',
      nombre: 'Juan',
      apPaterno: null,
      apMaterno: null,
      noEmpleado: 'E-1',
    });
  });

  it('returns 500 on unexpected server error', async () => {
    (validateUser as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

    const response = await POST(buildRequest({ username: 'testuser', password: 'validpassword' }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.message).toBe('Algo salió mal');
  });
});
