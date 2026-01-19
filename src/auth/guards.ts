import { redirect } from "next/navigation";
import { getAppUser } from "./auth.user";

export async function requireAuth() {
  const user = await getAppUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireDashboardAccess() {
  const user = await requireAuth();

  if (user.role === "user") {
    redirect("/forbidden");
  }

  return user;
}

export async function requireFrenteAccess(frente: string) {
  const user = await requireDashboardAccess();

  if (user.role === "owner") return user;

  if (!user.frentes.includes(frente)) {
    redirect("/forbidden");
  }

  return user;
}
