"use client";

import { usePathname, useRouter } from "next/navigation";
import { QrCode, Database, Package, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/roles";

interface NavItem {
  value: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  allowedRoles: Role[];
  iconColor: string;
  iconBg: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    value: "qr",
    label: "Generador de QRs",
    description: "Genera QRs para camiones",
    icon: QrCode,
    href: "/trucks",
    allowedRoles: ["owner"],
    iconColor: "text-emerald-600",
    iconBg:    "bg-emerald-500/10 group-hover:bg-emerald-500/20",
  },
  {
    value: "db",
    label: "Bases de Datos",
    description: "Historial de vouchers",
    icon: Database,
    href: "/trucks/db",
    allowedRoles: ["owner", "admin", "general"],
    iconColor: "text-blue-500",
    iconBg:    "bg-blue-500/10 group-hover:bg-blue-500/20",
  },
  {
    value: "dashboard",
    label: "Dashboard",
    description: "KPIs y métricas",
    icon: BarChart3,
    href: "/trucks/dashboard",
    allowedRoles: ["owner", "general"],
    iconColor: "text-violet-500",
    iconBg:    "bg-violet-500/10 group-hover:bg-violet-500/20",
  },
  {
    value: "materials",
    label: "Materiales",
    description: "Gestión de materiales",
    icon: Package,
    href: "/trucks/materials",
    allowedRoles: ["owner"],
    iconColor: "text-amber-500",
    iconBg:    "bg-amber-500/10 group-hover:bg-amber-500/20",
  },
  {
    value: "users",
    label: "Usuarios",
    description: "CRM de usuarios",
    icon: Users,
    href: "/trucks/users",
    allowedRoles: ["owner"],
    iconColor: "text-sky-500",
    iconBg:    "bg-sky-500/10 group-hover:bg-sky-500/20",
  },
];

export function TrucksNav({ userRole }: { userRole: Role }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item: NavItem) => {
    if (item.href === "/trucks") return pathname === "/trucks";
    return pathname.startsWith(item.href);
  };

  const visibleItems = NAV_ITEMS.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group w-full",
                active
                  ? "bg-accent text-white shadow-md"
                  : "text-foreground/70 hover:bg-muted/60"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                  active
                    ? "bg-white/20"
                    : cn(item.iconBg, "group-hover:scale-110")
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-white" : item.iconColor
                  )}
                />
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold leading-tight", active ? "text-white" : "")}>
                  {item.label}
                </p>
                <p className={cn("text-xs leading-tight mt-0.5 truncate", active ? "text-white/65" : "text-muted-foreground")}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <nav className="flex md:hidden gap-1.5 overflow-x-auto pb-1 w-full">
        {visibleItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all duration-200 shrink-0 text-sm font-semibold",
                active
                  ? "bg-accent text-white shadow-md"
                  : "bg-muted/60 text-foreground/70 hover:bg-muted"
              )}
            >
              <div
                className={cn(
                  "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
                  active ? "bg-white/20" : item.iconBg
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    active ? "text-white" : item.iconColor
                  )}
                />
              </div>
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default TrucksNav;
