"use server";
import { signOut } from "@/auth";
import { LogoutButton } from "./common";
import { BrandMark } from "./branding/BrandMark";
import whiteLabelConfig from "../../white-label.config";

const Navbar = ({ userName }: { userName: string | undefined }) => {
  return (
    <nav className="h-14 bg-primary flex justify-between items-center p-8">
      <BrandMark />
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
            <span className="hidden md:block">{whiteLabelConfig.auth.welcomeLabel}, {userName}</span>
            <LogoutButton />
          </>
        ) : null}
      </form>
    </nav>
  );
};

export default Navbar;
