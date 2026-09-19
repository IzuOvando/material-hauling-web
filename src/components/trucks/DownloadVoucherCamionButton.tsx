"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import { Section } from "@/types";
import { Download } from "lucide-react";
import CONFIG from "@/config";
import whiteLabelConfig from "../../../white-label.config";

const DownloadFrenteButton = ({
  frente,
  section,
}: {
  frente: string;
  section: Section;
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const saveFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadDatabase = async () => {
    setIsLoading(true);
    let disableToast: () => void;
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/files/downloadbbd`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frente: frente, section: section }),
      });

      if (!response.ok) {
        throw new Error(`Error downloading database: ${response.status}`);
      }

      const blob = await response.blob();
      const filename = `${frente}_${section}_vouchers.xlsx`;
      saveFile(blob, filename);
      const { dismiss } = toast({
        title: whiteLabelConfig.ui.vouchers.downloadSuccessTitle,
        description: whiteLabelConfig.ui.vouchers.downloadSuccessDescription
          .replace("{section}", section.toLowerCase())
          .replace("{frente}", frente)
          .replace("{filename}", filename),
        variant: "success",
      });
      disableToast = dismiss;
    } catch (ex) {
      console.error("On Download:", ex);
      const { dismiss } = toast({
        title: whiteLabelConfig.ui.vouchers.downloadErrorTitle,
        description: whiteLabelConfig.ui.vouchers.downloadErrorDescription,
        variant: "destructive",
      });
      disableToast = dismiss;
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => {
      disableToast();
    }, 3000);
  };

  return (
    <>
      {isLoading && <FullScreenLoader message={whiteLabelConfig.ui.vouchers.generatingExcelMessage} />}
      <Button
        className="py-2 px-[0.5rem] bg-white hover:bg-[rgba(var(--accent-light-color)/50%)] group ml-[-2.5px]"
        onClick={downloadDatabase}
        disabled={isLoading}
      >
        <Download className="text-accent" />
      </Button>
    </>
  );
};

export default DownloadFrenteButton;
