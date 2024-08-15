import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { TicketArea } from "@/types";
import { Download } from "lucide-react";
import CONFIG from "@/config";

const DownloadFrenteButton = ({
  frente,
  area,
  areTickets,
}: {
  frente: string;
  area: TicketArea;
  areTickets: {
    [key in TicketArea]: boolean;
  };
}) => {
  const { toast } = useToast();

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
    let disableToast: () => void;
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/api/files/downloadbbd`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frente: frente, area: area }),
      });

      if (!response.ok) {
        throw new Error(`Error downloading database: ${response.status}`);
      }

      const blob = await response.blob();
      const filename = `${frente}_${area}_tickets.xlsx`;
      saveFile(blob, filename);
      const { dismiss } = toast({
        title: "Descarga Exitosa",
        description: `La base de datos de tickets de ${area.toLowerCase()} para el frente "${frente}" se ha descargado correctamente como ${filename}.`,
        variant: "success",
      });
      disableToast = dismiss;
    } catch (ex) {
      console.error("On Download:", ex);
      const { dismiss } = toast({
        title: "Descarga Fallida",
        description: `Tuvimos un problema al descargar la base de datos. Por favor, intente de nuevo más tarde.`,
        variant: "destructive",
      });
      disableToast = dismiss;
    }

    setTimeout(() => {
      disableToast();
    }, 3000);
  };

  if (!areTickets[area]) return null;

  return (
    <Button
      className="py-2 px-[0.5rem] bg-white hover:bg-[rgba(var(--accent-light-color)/50%)] group ml-[-2.5px]"
      onClick={downloadDatabase}
    >
      <Download className="text-accent" />
    </Button>
  );
};

export default DownloadFrenteButton;
