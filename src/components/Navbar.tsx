"use server";
import Image from "next/image";
import { Button } from "./ui/button";
import { signOut } from "@/auth";
import { ToggleNavButton } from "./common";

const Navbar = ({ userName }: { userName: string | undefined }) => {
  return (
    <nav className="h-14 bg-primary-dark flex justify-between items-center p-8">
      <Image
        src="/images/logos/logo_mexico.svg"
        width={128}
        height={48}
        alt="logo"
      />
      <form
        className="flex text-white gap-6 items-center"
        action={async () => {
          "use server";

          await signOut({
            redirectTo: "/login",
          });
        }}
      >
        {userName ? (
          <>
            <ToggleNavButton />
            <span className="hidden md:block">Bienvenido, {userName}</span>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent-light active:bg-accent-dark"
            >
              Cerrar Sesión
            </Button>
          </>
        ) : null}
      </form>
    </nav>
  );
};

export default Navbar;
