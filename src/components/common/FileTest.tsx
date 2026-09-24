"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";

interface FileTestProps {
  downloadText?: string;
  filePath: string;
  fileName?: string;
  description?: string;
}

const FileTest = ({
  downloadText = "Click aquí",
  filePath,
  fileName,
  description,
}: FileTestProps) => {
  return (
    <Card>
      <CardContent className="text-center space-y-4">
        {description && <p className="text-gray-600">{description}</p>}
        <a
          href={filePath}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="bg-secondary hover:bg-secondary/90 active:bg-secondary/80 mt-2 gap-2">
            <Download className="w-4 h-4" />
            {downloadText}
          </Button>
        </a>
      </CardContent>
    </Card>
  );
};

export default FileTest;
