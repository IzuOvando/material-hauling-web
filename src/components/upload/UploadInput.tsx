"use client";
import React, { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleFileUpload } from "@/actions/fileupload";
import useFrenteStore from "@/contexts/useFrenteStore";

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { selectedFrente } = useFrenteStore();

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
      selectedFrente,
      file,
      setIsLoading,
      toast,
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <Input
        ref={fileInputRef}
        type="file"
        onChange={onFileChange}
        style={{ display: "none" }}
        accept=".xlsx"
      />
      <Button
        onClick={triggerFileInput}
        className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark"
        disabled={isLoading}
      >
        {isLoading ? "Subiendo..." : "Subir Archivo"}
      </Button>
    </div>
  );
};

export default FileUpload;
