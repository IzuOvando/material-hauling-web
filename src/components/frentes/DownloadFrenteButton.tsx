"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import FullScreenLoader from "@/components/ui/full-screen-loader";
import { Download } from "lucide-react";
import CONFIG from "@/config";
import whiteLabelConfig from "../../../white-label.config";

const DownloadFrenteButton = ({ frente }: { frente: string }) => {
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
        body: JSON.stringify({ frente, section: "VOUCHERCAMION" }),
      });

      if (!response.ok) {
        throw new Error(`Error downloading database: ${response.status}`);
      }

      const blob = await response.blob();
      const filename = `${frente}_vouchercamion.xlsx`;
      saveFile(blob, filename);
      const { dismiss } = toast({
        title: whiteLabelConfig.ui.vouchers.downloadSuccessTitle,
        description: whiteLabelConfig.ui.vouchers.downloadSuccessDescription
          .replace("{section}", "vouchers")
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
        className="py-2 px-[0.5rem] bg-white hover:bg-[rgba(var(--accent-color)/20%)] group ml-[-2.5px]"
        onClick={downloadDatabase}
        disabled={isLoading}
      >
        <Download className="text-accent" />
      </Button>
    </>
  );
};

export default DownloadFrenteButton;
