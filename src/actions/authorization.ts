"use server";
import { signIn, getPostLoginRoute } from "@/auth";
import { InvalidCredentialsError } from "@/auth/InvalidCredentialsError";
import { redirect } from "next/navigation";

export async function authenticate(
  prevState: { attempts: number; error: string },
  formData: FormData,
) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const attempts = prevState?.attempts || 0;

  if (!username || !password)
    return {
      attempts: attempts + 1,
      error: "Required attributes username & password",
    };

  try {
    await signIn("credentials", { username, password });
  } catch (error: any) {
    if (error instanceof InvalidCredentialsError)
      return {
        attempts: attempts + 1,
        error: "Invalid Credentials",
      };
    if (error.type === "CallbackRouteError")
      return {
        attempts: attempts + 1,
        error: "Something went wrong",
      };
  }

  redirect(getPostLoginRoute(username));
}
