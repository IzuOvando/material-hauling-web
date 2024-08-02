"use client";
import React, { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleFileUpload } from "@/actions/fileupload";
import CONFIG from "@/config";
import { Upload } from "lucide-react";
import { Frente } from "@prisma/client";
import { useUser } from '@/contexts/UserContext';

interface FileUpdateProps {
  selectedFrente: Frente;
  selectedArea: any;
  onUpload: () => void;
}

const FileUpload: React.FC<FileUpdateProps> = ({
  selectedFrente,
  selectedArea,
  onUpload,
}) => {
  const { role } = useUser();
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

    await handleFileUpload(
      selectedArea,
      selectedFrente,
      file,
      setIsLoading,
      toast,
      CONFIG.BASE_URL,
      onUpload
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {role === "admin" && (
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
        className={`w-full flex items-center gap-2 ${isLoading ? 'bg-secondary-light' : 'bg-secondary'} ${role !== 'admin' && 'opacity-50 cursor-not-allowed'}`}
        disabled={isLoading || role !== 'admin'}
      >
        <Upload size={18} color="white" />
        {isLoading ? "Subiendo..." : "Subir Archivo"}
      </Button>
    </>
  );
};

export default FileUpload;
