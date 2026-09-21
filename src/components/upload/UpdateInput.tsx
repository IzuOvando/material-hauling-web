"use client";
import React, { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleFileUpload } from "@/actions/fileupload";
import { handleDeleteFiles } from "@/actions/deletefiles";
import CONFIG from "@/config";
import { Upload } from "lucide-react";
import { Frente } from "@prisma/client";
import { useUser } from '@/contexts/UserContext';

interface FileUpdateProps {
  selectedFrente: Frente;
  selectedArea: any;
  onUpdate: () => void;
}

const FileUpdate: React.FC<FileUpdateProps> = ({
  selectedFrente,
  selectedArea,
  onUpdate,
}) => {
  const { isAdmin } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    if (!selectedFrente) {
      toast({
        title: "Error",
        description: `No se ha seleccionado ningun frente.`,
        variant: "destructive",
      });
      return;
    }

    const { success, errorMessage } = await handleDeleteFiles(
      selectedArea,
      selectedFrente,
      setIsLoading,
      toast,
      CONFIG.BASE_URL
    );

    if (!success) {
      console.error("Error deleting files:", errorMessage);
      return;
    }

    await handleFileUpload(
      selectedArea,
      selectedFrente,
      file,
      setIsLoading,
      toast,
      onUpdate,
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {isAdmin && (
        <Input
          ref={fileInputRef}
          type="file"
          onChange={onFileChange}
          style={{ display: "none" }}
          accept=".xlsx"
        />
      )}
      <Button
        onClick={triggerFileInput}
        className={`w-full flex items-center gap-2 ${
          isLoading ? "bg-secondary/60" : "bg-secondary"
        } ${!isAdmin && "opacity-50 cursor-not-allowed"}`}
        disabled={isLoading || !isAdmin}
      >
        <Upload size={18} color="white" />
        {isLoading ? "Subiendo..." : "Actualizar Archivo"}
      </Button>
    </>
  );
};

export default FileUpdate;
