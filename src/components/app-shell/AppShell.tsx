import Script from "next/script";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import { EnterprisesImagesInitializer } from "@/contexts";
import { UserProvider } from "@/contexts/UserContext";
import { TenantBrandingProvider } from "@/components/branding/TenantBrandingProvider";
import type { AppUser } from "@/types/auth";

interface AppShellProps {
  children: React.ReactNode;
  user: AppUser | null;
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <TenantBrandingProvider>
      <UserProvider user={user}>
        <Navbar userName={user?.name} />
        {children}
        <Toaster />
        <EnterprisesImagesInitializer />
      </UserProvider>
    </TenantBrandingProvider>
  );
}
