import { AuthError } from "next-auth";

export class InvalidCredentialsError extends AuthError {
  constructor(message: string = "Invalid Credentials") {
    super();
    this.name = "InvalidCredentialsError";
    this.message = message;
    this.stack = undefined;
  }
}
