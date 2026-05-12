"use client";

import { usePathname, useRouter } from "next/navigation";
import { QrCode, Database, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  value: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  ownerOnly: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    value: "qr",
    label: "Generador de QRs",
    description: "Genera QRs para camiones",
    icon: QrCode,
    href: "/trucks",
    ownerOnly: true,
  },
  {
    value: "db",
    label: "Bases de Datos",
    description: "Historial de vouchers",
    icon: Database,
    href: "/trucks/db",
    ownerOnly: false,
  },
  {
    value: "materials",
    label: "Materiales",
    description: "Gestión de materiales",
    icon: Package,
    href: "/trucks/materials",
    ownerOnly: true,
  },
  {
    value: "users",
    label: "Usuarios",
    description: "CRM de usuarios",
    icon: Users,
    href: "/trucks/users",
    ownerOnly: true,
  },
];

export function TrucksNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: NavItem) => {
    if (item.href === "/trucks") return pathname === "/trucks";
    return pathname.startsWith(item.href);
  };

  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner);

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0 pr-4 self-start sticky top-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 mb-2">
          Módulos
        </p>
        {visibleItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group w-full",
                active
                  ? "bg-accent text-white shadow-md"
                  : "text-foreground/70 hover:bg-primary/[0.07] hover:text-primary"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  active
                    ? "text-white"
                    : "text-primary/50 group-hover:text-primary"
                )}
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    active ? "text-white" : ""
                  )}
                >
                  {item.label}
                </p>
                <p
                  className={cn(
                    "text-xs leading-tight mt-0.5 truncate",
                    active ? "text-white/65" : "text-muted-foreground"
                  )}
                >
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mobile: horizontal scrollable row */}
      <nav className="flex md:hidden gap-1.5 overflow-x-auto pb-1 w-full">
        {visibleItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200 shrink-0 text-sm font-semibold",
                active
                  ? "bg-accent text-white shadow-md"
                  : "bg-muted/60 text-foreground/70 hover:bg-primary/[0.07] hover:text-primary"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-white" : "text-primary/50"
                )}
              />
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default TrucksNav;
