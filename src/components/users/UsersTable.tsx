"use client";

import { useState, useEffect } from "react";
import { Pencil, Link2, Trash2, KeyRound, Users, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { FrentesUserDialog } from "@/components/users/FrentesUserDialog";
import { DeleteUserAlertDialog } from "@/components/users/DeleteUserAlertDialog";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";
import { UsersToolbar } from "@/components/users/UsersToolbar";
import { NewUserSheet } from "@/components/users/NewUserSheet";
import type { UserRow } from "@/types";

interface UsersTableProps {
  frentes: string[];
}

function RolBadge({ rol }: { rol: string }) {
  if (rol === "admin") {
    return (
      <Badge className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-100 font-medium text-xs">
        IRO
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100 font-medium text-xs">
      Checador
    </Badge>
  );
}

function FrentesBadges({ frentes }: { frentes: string[] }) {
  const visible = frentes.slice(0, 3);
  const extra = frentes.length - 3;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((f) => (
        <Badge key={f} variant="outline" className="text-xs font-normal px-1.5 py-0">
          {f}
        </Badge>
      ))}
      {extra > 0 && (
        <Badge variant="outline" className="text-xs font-normal px-1.5 py-0 text-muted-foreground">
          +{extra} más
        </Badge>
      )}
      {frentes.length === 0 && (
        <span className="text-xs text-muted-foreground italic">Sin frentes</span>
      )}
    </div>
  );
}

function SkeletonRows() {
  const widths = [
    ["w-24", "w-14", "w-36", "w-16", "w-20 w-16", ""],
    ["w-28", "w-16", "w-44", "w-20", "w-18", ""],
    ["w-20", "w-14", "w-32", "w-14", "w-24 w-16", ""],
    ["w-32", "w-16", "w-40", "w-18", "w-20", ""],
    ["w-22", "w-14", "w-36", "w-16", "w-16 w-18", ""],
  ];
  return (
    <>
      {widths.map((row, i) => (
        <TableRow key={i} className="border-b border-border/50">
          <TableCell className="py-3">
            <div className={`h-4 ${row[0]} bg-muted animate-pulse rounded`} />
          </TableCell>
          <TableCell className="py-3">
            <div className={`h-5 ${row[1]} bg-muted animate-pulse rounded-full`} />
          </TableCell>
          <TableCell className="py-3">
            <div className={`h-4 ${row[2]} bg-muted animate-pulse rounded`} />
          </TableCell>
          <TableCell className="py-3">
            <div className={`h-4 ${row[3]} bg-muted animate-pulse rounded`} />
          </TableCell>
          <TableCell className="py-3">
            <div className="flex gap-1.5">
              <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
              {i % 2 === 0 && <div className="h-5 w-14 bg-muted animate-pulse rounded-full" />}
            </div>
          </TableCell>
          <TableCell className="py-3">
            <div className="flex gap-1 justify-end">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-7 w-7 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function UsersTable({ frentes }: UsersTableProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [frenteFilter, setFrenteFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [frentesOpen, setFrentesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newUserOpen, setNewUserOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data: UserRow[] = await res.json();
        setUsers(data.filter((u) => u.rol === "user" || u.rol === "admin"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const removeUserFromList = (username: string) => {
    setUsers((prev) => prev.filter((u) => u.username !== username));
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      search === "" || u.username.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.rol === roleFilter;
    const matchFrente =
      frenteFilter === "all" || u.frentes.includes(frenteFilter);
    return matchSearch && matchRole && matchFrente;
  });

  const hasActiveFilters =
    search !== "" || roleFilter !== "all" || frenteFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setFrenteFilter("all");
  };

  const openAction = (
    user: UserRow,
    action: "edit" | "frentes" | "delete" | "reset"
  ) => {
    setSelectedUser(user);
    if (action === "edit") setEditOpen(true);
    else if (action === "frentes") setFrentesOpen(true);
    else if (action === "delete") setDeleteOpen(true);
    else if (action === "reset") setResetOpen(true);
  };

  return (
    <div>
      <UsersToolbar
        search={search}
        onSearch={setSearch}
        roleFilter={roleFilter}
        onRoleFilter={setRoleFilter}
        frenteFilter={frenteFilter}
        onFrenteFilter={setFrenteFilter}
        frentes={frentes}
        onNewUser={() => setNewUserOpen(true)}
      />

      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary border-0">
              <TableHead className="text-xs tracking-wide uppercase text-accent font-semibold w-40">
                Usuario
              </TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-accent font-semibold w-24">
                Rol
              </TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-accent font-semibold">
                Nombre completo
              </TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-accent font-semibold w-32">
                No. Empleado
              </TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-accent font-semibold">
                Frentes asignados
              </TableHead>
              <TableHead className="text-xs tracking-wide uppercase text-accent font-semibold w-40 text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : filtered.length === 0 && !hasActiveFilters ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Users className="h-12 w-12 opacity-30" />
                    <p className="text-sm font-medium">No hay usuarios registrados.</p>
                    <p className="text-xs opacity-70">
                      Crea el primer usuario con el botón &quot;Nuevo Usuario&quot;.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Search className="h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium">
                      Sin resultados para los filtros aplicados.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-1"
                    >
                      Limpiar filtros
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow
                  key={user.username}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <span className="font-mono text-sm font-medium">
                      {user.username}
                    </span>
                  </TableCell>
                  <TableCell>
                    <RolBadge rol={user.rol} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {[user.nombre, user.apPaterno, user.apMaterno]
                      .filter(Boolean)
                      .join(" ")}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-muted-foreground">
                      {user.noEmpleado}
                    </span>
                  </TableCell>
                  <TableCell>
                    <FrentesBadges frentes={user.frentes} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar usuario"
                        onClick={() => openAction(user, "edit")}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Gestionar frentes"
                        onClick={() => openAction(user, "frentes")}
                        className="h-8 w-8 hover:bg-accent/10 hover:text-accent-dark transition-colors"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Eliminar usuario"
                        onClick={() => openAction(user, "delete")}
                        className="h-8 w-8 text-muted-foreground/70 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Restablecer contraseña"
                        onClick={() => openAction(user, "reset")}
                        className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary transition-colors"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <>
          <EditUserDialog
            user={selectedUser}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={fetchUsers}
          />
          <FrentesUserDialog
            user={selectedUser}
            frentes={frentes}
            open={frentesOpen}
            onOpenChange={setFrentesOpen}
            onSuccess={fetchUsers}
          />
          <DeleteUserAlertDialog
            username={selectedUser.username}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDelete={removeUserFromList}
          />
          <ResetPasswordDialog
            username={selectedUser.username}
            open={resetOpen}
            onOpenChange={setResetOpen}
          />
        </>
      )}
      <NewUserSheet
        frentes={frentes}
        open={newUserOpen}
        onOpenChange={setNewUserOpen}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
