"use client";
import React, { useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { handleFileUpload } from "@/actions/fileupload";
import CONFIG from "@/config";

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    await handleFileUpload(file, setIsLoading, toast, CONFIG.BASE_URL);
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
