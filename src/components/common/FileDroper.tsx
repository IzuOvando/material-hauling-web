import { useState, useCallback } from "react";
import { useDropzone, Accept } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileSpreadsheet } from "lucide-react";

interface FileDroperProps {
  accept?: Accept;
  description?: string;
  buttonText?: string;
  dropzoneText?: string;
  multiple?: boolean;
  onFileChange: (files: File[]) => void;
}

const FileDroper = ({
  description = "Drag & Drop",
  buttonText = "Upload",
  dropzoneText = "Drop here",
  multiple = false,
  accept,
  onFileChange,
}: FileDroperProps) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
      onFileChange(acceptedFiles);
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });
  return (
    <Card>
      <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className="relative border-2 border-dashed border-secondary-light/40 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-secondary-light"
        >
          <input {...getInputProps()} />
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground text-secondary mb-4" />
          <p className="text-muted-foreground mb-2">{description}</p>
          <Button className="bg-secondary hover:bg-secondary-light active:bg-secondary-dark mt-2">
            {buttonText}
          </Button>
          {isDragActive && (
            <div className="absolute inset-0 bg-secondary/70 flex items-center justify-center rounded-lg">
              <p className="text-lg font-semibold text-white">{dropzoneText}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileDroper;
