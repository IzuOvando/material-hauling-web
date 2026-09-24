"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTrucksTable } from "@/hooks/useTrucksTable";
import whiteLabelConfig from "#/white-label.config";

interface DownloadTrucksExcelButtonProps {
  frente: string;
  total: number;
}

export function DownloadTrucksExcelButton({
  frente,
  total,
}: DownloadTrucksExcelButtonProps) {
  const { effectiveFiltersString, sort } = useTrucksTable();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/trucks/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frente,
          filters: effectiveFiltersString,
          sort: sort ?? undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `${frente}_vouchers_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: whiteLabelConfig.ui.vouchers.excelDownloadSuccessTitle,
        description: whiteLabelConfig.ui.vouchers.excelDownloadSuccessDescription.replace(
          "{count}",
          total.toLocaleString("es-MX")
        ),
        variant: "success",
      });
    } catch (error) {
      console.error("Excel download failed", error);
      toast({
        title: whiteLabelConfig.ui.vouchers.excelDownloadErrorTitle,
        description: whiteLabelConfig.ui.vouchers.excelDownloadErrorDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel =
    total > 0
      ? `${whiteLabelConfig.ui.vouchers.excelButtonPrefix} ${total.toLocaleString("es-MX")} ${total === 1 ? "voucher" : "vouchers"}`
      : whiteLabelConfig.ui.vouchers.excelButtonEmpty;

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading || total === 0}
      className="h-9 gap-2 bg-accent hover:bg-accent/90 text-white"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span>{buttonLabel}</span>
    </Button>
  );
}
