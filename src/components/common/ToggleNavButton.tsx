"use client";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Button } from "../ui/button";

const ToggleNavButton = () => {
  const { isOwner } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  if (!isOwner) return null;

  const isAcarreos =
    pathname === "/" ||
    pathname.startsWith("/db") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/materials") ||
    pathname.startsWith("/users");

  const handleGoTo = () => {
    router.push(isAcarreos ? "/voucher" : "/");
  };

  return (
    <Button
      type="button"
      onClick={handleGoTo}
      className="bg-primary hover:bg-primary-light active:bg-primary-dark hidden md:block"
    >
      {isAcarreos ? "Ir a Vouchers" : "Ir a Acarreos"}
    </Button>
  );
};

export default ToggleNavButton;
