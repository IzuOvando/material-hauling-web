/**
 * @jest-environment node
 */

import { POST } from './route';
import { validateUser } from '@/lib/db/validateUser';
import { generateSaltAndHash } from '@/utils/crypto/cryptoUtils';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db/validateUser');
jest.mock('@/utils/crypto/cryptoUtils');

describe('POST /mobile/auth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if username or password is missing', async () => {
    const request = new NextRequest("http://localhost:3000/api/mobile/auth", {
      method: "POST",
      body: JSON.stringify({ username: '', password: '' }),
    });

    const response = await POST(request as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(400);
    expect(jsonResponse.message).toBe('Username and password are required');
  });

  it('should return 401 if user is not found or invalid password', async () => {
    (validateUser as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/mobile/auth", {
      method: "POST",
      body: JSON.stringify({ username: 'testuser', password: 'wrongpassword' }),
    });

    const response = await POST(request as any);
    const jsonResponse = await response.json();

    expect(validateUser).toHaveBeenCalledWith('testuser', 'wrongpassword');
    expect(response.status).toBe(401);
    expect(jsonResponse.message).toBe('Invalid username/password');
  });

  it('should return 201 and a salt and hash if validation is successful', async () => {
    const mockUser = {
      username: 'testuser',
      password: 'hashedpassword',
    };

    (validateUser as jest.Mock).mockResolvedValue(mockUser);
    (generateSaltAndHash as jest.Mock).mockReturnValue({
      salt: 'randomsalt',
      hash: 'randomhash',
    });

    const request = new NextRequest("http://localhost:3000/api/mobile/auth", {
      method: "POST",
      body: JSON.stringify({ username: 'testuser', password: 'validpassword' }),
    });

    const response = await POST(request as any);
    const jsonResponse = await response.json();

    expect(validateUser).toHaveBeenCalledWith('testuser', 'validpassword');
    expect(generateSaltAndHash).toHaveBeenCalledWith('testuser:hashedpassword');
    expect(response.status).toBe(201);
    expect(jsonResponse.authorization).toEqual({
      salt: 'randomsalt',
      hash: 'randomhash',
    });
  });

  it('should return 500 on unexpected server error', async () => {
    (validateUser as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

    const request = new NextRequest("http://localhost:3000/api/mobile/auth", {
      method: "POST",
      body: JSON.stringify({ username: 'testuser', password: 'validpassword' }),
    });

    const response = await POST(request as any);
    const jsonResponse = await response.json();

    expect(response.status).toBe(500);
    expect(jsonResponse.message).toBe('Something went wrong');
  });
});
