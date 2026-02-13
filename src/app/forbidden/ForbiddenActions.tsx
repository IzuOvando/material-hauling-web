"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/common";
import { useUser } from "@/contexts/UserContext";
import { logout } from "@/actions/logout";

export function ForbiddenActions() {
  const { user } = useUser();
  const isUserRole = user?.role === "user";

  if (isUserRole) {
    return (
      <form action={logout}>
        <LogoutButton />
      </form>
    );
  }

  return (
    <Button asChild className="bg-secondary hover:bg-secondary-light">
      <Link href="/">Volver al inicio</Link>
    </Button>
  );
}
