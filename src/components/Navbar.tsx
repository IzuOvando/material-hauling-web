"use server";
import Image from "next/image";
import { signOut } from "@/auth";
import { LogoutButton } from "./common";

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
            <span className="hidden md:block">Bienvenido, {userName}</span>
            <LogoutButton />
          </>
        ) : null}
      </form>
    </nav>
  );
};

export default Navbar;
