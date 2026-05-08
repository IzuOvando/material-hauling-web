import { requireOwnerAccess } from "@/auth/guards";
import prisma from "@/lib/db";
import { CreateUserForm } from "@/components/users/CreateUserForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users } from "lucide-react";

export default async function UsersManagementPage() {
  await requireOwnerAccess();

  const frentes = await prisma.frente.findMany({
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="w-full">
      <Tabs defaultValue="register" className="w-full">
        
        <div className="flex justify-center mb-6">
          <TabsList className="h-auto p-1 bg-primary/10 border border-primary/20 rounded-lg gap-1">
            <TabsTrigger
              value="register"
              className="
                flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md
                text-primary/70
                data-[state=active]:bg-primary data-[state=active]:text-accent data-[state=active]:shadow-sm
                hover:text-primary transition-colors
              "
            >
              <UserPlus className="h-4 w-4" />
              Registrar
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="
                flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md
                text-primary/70
                data-[state=active]:bg-primary data-[state=active]:text-accent data-[state=active]:shadow-sm
                hover:text-primary transition-colors
              "
            >
              <Users className="h-4 w-4" />
              Gestionar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="register">
          <CreateUserForm frentes={frentes.map((f) => f.nombre)} />
        </TabsContent>

        <TabsContent value="manage">
          <UsersTableSlot />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTableSlot() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <Users className="h-10 w-10 opacity-30" />
      <p className="text-sm">La tabla de usuarios estará disponible próximamente.</p>
    </div>
  );
}