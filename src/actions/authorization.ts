"use server";
import { signIn } from "@/auth";

export async function authenticate(
  prevState: { attempts: number; error: string },
  formData: FormData
) {
  const username = formData.get("username");
  const password = formData.get("password");
  const attempts = prevState?.attempts || 0;

  if (!username || !password)
    return {
      attempts: attempts + 1,
      error: "Required attributes username & password",
    };

  try {
    await signIn("credentials", {
      username: username,
      password: password,
      redirectTo: "/",
    });
    return {
      attempts: attempts,
      error: "Done",
    };
  } catch (error: any) {
    if (error?.cause?.err?.code === "credentials")
      return {
        attempts: attempts + 1,
        error: "Invalid Credentials",
      };
    if (error.type === "CallbackRouteError")
      return {
        attempts: attempts + 1,
        error: "Something went wrong",
      };

    throw error;
  }
}
