import jwt from 'jsonwebtoken';
import CONFIG from "@/config";

export class TokenAuthenticator {

  private static ACCESS_TOKEN_SECRET = CONFIG.ACCESS_TOKEN_SECRET || (() => { throw new Error("ACCESS_TOKEN_SECRET is not defined in CONFIG") })();
  private static REFRESH_TOKEN_SECRET = CONFIG.REFRESH_TOKEN_SECRET || (() => { throw new Error("REFRESH_TOKEN_SECRET is not defined in CONFIG") })();
  private static ACCESS_TOKEN_EXPIRACY = CONFIG.TOKEN_EXPIRACY.ACCESS;
  private static REFRESH_TOKEN_EXPIRACY = CONFIG.TOKEN_EXPIRACY.REFRESH;

  static authenticate(username: string, role: string) {
    const accessToken = jwt.sign(
      { username, role },
      TokenAuthenticator.ACCESS_TOKEN_SECRET,
      { expiresIn: TokenAuthenticator.ACCESS_TOKEN_EXPIRACY }
    );

    const refreshToken = jwt.sign(
      { username, role },
      TokenAuthenticator.REFRESH_TOKEN_SECRET,
      { expiresIn: TokenAuthenticator.REFRESH_TOKEN_EXPIRACY }
    );

    return { accessToken, refreshToken };
  }

  static verify(accessToken: string): boolean {
    try {
      jwt.verify(accessToken, TokenAuthenticator.ACCESS_TOKEN_SECRET);
      return true;
    } catch (error) {
      return false;
    }
  }

  static refresh(refreshToken: string): { accessToken: string, refreshToken: string } {
    try {
      const decoded = jwt.verify(refreshToken, TokenAuthenticator.REFRESH_TOKEN_SECRET) as jwt.JwtPayload;

      if (!decoded.username || !decoded.role) {
        throw new Error("Invalid refreshToken claims");
      }

      const newAccessToken = jwt.sign(
        { username: decoded.username, role: decoded.role },
        TokenAuthenticator.ACCESS_TOKEN_SECRET,
        { expiresIn: TokenAuthenticator.ACCESS_TOKEN_EXPIRACY }
      );

      const newRefreshToken = jwt.sign(
        { username: decoded.username, role: decoded.role },
        TokenAuthenticator.REFRESH_TOKEN_SECRET,
        { expiresIn: TokenAuthenticator.REFRESH_TOKEN_EXPIRACY }
      );

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Invalid refreshToken: expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refreshToken: malformed");
      }
      throw new Error("An error occurred during refresh token verification");
    }
  }
}
