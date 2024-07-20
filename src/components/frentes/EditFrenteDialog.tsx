import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Frente } from "@prisma/client";
import { Trash } from "lucide-react";
import DeleteFrenteAlertDialog from "./DeleteFrenteAlertDialog";
import FileUpdate from "../upload/UpdateInput";
import FileUpload from "../upload/UploadInput";

interface EditFrenteDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  frente: Frente;
}

const EditFrenteDialog = ({ open, setOpen, frente }: EditFrenteDialogProps) => {
  const [areTickets, setAreTickets] = useState(false);
  const [area, setArea] = useState("gasolina");

  useEffect(() => {
    fetch("/api/frente/areTickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nombre: frente.nombre }),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setAreTickets(data?.areTickets);
      })
      .catch((err) => {
        console.error(
          "Error al verificar si hay tickets asociados al frente:",
          err
        );
      });
  }, [frente]);

  return (
    <AlertDialog>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Editar Frente</DialogTitle>
            <DialogDescription>
              Aquí puedes subir una base de datos para el{" "}
              <b>Frente {frente.nombre}</b> o eliminarla. <br />
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {areTickets ? (
              <FileUpdate selectedFrente={frente} selectedArea={area} />
            ) : (
              <FileUpload selectedFrente={frente} selectedArea={area} />
            )}

            <span className="text-center text-sm mb-5">
              Si ya existe una base de datos en el frente esta{" "}
              <b>sera reeplazada</b> con la nueva.
            </span>
            <AlertDialogTrigger asChild>
              <Button
                className="flex items-center gap-2 hover:bg-red-500 group"
                onClick={() => {
                  setTimeout(() => {
                    setOpen(false);
                  }, 500);
                }}
              >
                <Trash color="white" size={18} /> Eliminar Frente
              </Button>
            </AlertDialogTrigger>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteFrenteAlertDialog frente={frente} />
    </AlertDialog>
  );
};

export default EditFrenteDialog;
