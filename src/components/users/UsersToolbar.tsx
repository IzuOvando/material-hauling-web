"use client";

import { Search, UserPlus } from "lucide-react";
import whiteLabelConfig from "../../../white-label.config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UsersToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  roleFilter: string;
  onRoleFilter: (v: string) => void;
  frenteFilter: string;
  onFrenteFilter: (v: string) => void;
  frentes: string[];
  onNewUser: () => void;
}

export function UsersToolbar({
  search,
  onSearch,
  roleFilter,
  onRoleFilter,
  frenteFilter,
  onFrenteFilter,
  frentes,
  onNewUser,
}: UsersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={(whiteLabelConfig as any)?.ui?.users?.toolbar?.searchPlaceholder || 'Buscar por usuario...'}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9 border-2 focus-visible:ring-0 focus-visible:border-accent transition-colors"
        />
      </div>

      <Select value={roleFilter} onValueChange={onRoleFilter}>
        <SelectTrigger className="w-44 border-2 focus:ring-0 focus:border-accent">
          <SelectValue placeholder={(whiteLabelConfig as any)?.ui?.users?.toolbar?.allRoles || "Todos los roles"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{(whiteLabelConfig as any)?.ui?.users?.toolbar?.allRoles || "Todos los roles"}</SelectItem>
          <SelectItem value="user">{(whiteLabelConfig as any)?.ui?.users?.toolbar?.roleUser || "Checador"}</SelectItem>
          <SelectItem value="admin">{(whiteLabelConfig as any)?.ui?.users?.toolbar?.roleAdmin || "IRO"}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={frenteFilter} onValueChange={onFrenteFilter}>
        <SelectTrigger className="w-52 border-2 focus:ring-0 focus:border-accent">
          <SelectValue placeholder={(whiteLabelConfig as any)?.ui?.users?.toolbar?.allFrentes || "Todos los frentes"} />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <SelectItem value="all">{(whiteLabelConfig as any)?.ui?.users?.toolbar?.allFrentes || "Todos los frentes"}</SelectItem>
          {frentes.map((f) => (
            <SelectItem key={f} value={f}>
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      <Button
        onClick={onNewUser}
        className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark text-white gap-2 transition-all duration-200"
      >
        <UserPlus className="h-4 w-4" />
        {(whiteLabelConfig as any)?.ui?.users?.toolbar?.newUserButton || 'Nuevo Usuario'}
      </Button>
    </div>
  );
}
