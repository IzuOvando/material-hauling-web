"use server";
import Image from "next/image";
import { signOut } from "@/auth";
import { LogoutButton } from "./common";
import whiteLabelConfig from "../../white-label.config";

const Navbar = ({ userName }: { userName: string | undefined }) => {
  const { appName, logoUrl, welcomeLabel } = {
    appName: whiteLabelConfig.app.name,
    logoUrl: whiteLabelConfig.branding.logoUrl,
    welcomeLabel: whiteLabelConfig.auth.welcomeLabel,
  };

  return (
    <nav className="h-14 bg-primary-dark flex justify-between items-center p-8">
      {logoUrl ? (
        <Image
          src={logoUrl}
          width={128}
          height={48}
          alt={`${appName} logo`}
        />
      ) : (
        <div className="text-white font-semibold tracking-wide">{appName}</div>
      )}
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
            <span className="hidden md:block">{welcomeLabel}, {userName}</span>
            <LogoutButton />
          </>
        ) : null}
      </form>
    </nav>
  );
};

export default Navbar;
