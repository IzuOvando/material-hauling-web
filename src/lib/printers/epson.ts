type connectionCallbackType = (
  status: "online" | "offline" | "connecting"
) => void;

export default class EpsonPrinter {
  private ipAddress: string;
  private device: any;
  private instruction:
    | "isOnline"
    | "paperEnd"
    | "paperNearEnd"
    | "print"
    | null;
  private status: "online" | "offline" | "connecting";

  private connectionCallback: connectionCallbackType | null = null;

  constructor(ipAddress: string, connectionCallback: connectionCallbackType) {
    this.ipAddress = ipAddress;
    this.instruction = null;
    this.status = "connecting";
    // Connecting to printer
    this.connect(connectionCallback);
  }

  public connect(callback: connectionCallbackType) {
    console.log(`Connecting to printer (${this.ipAddress})...`);
    this.instruction = "isOnline";
    this.status = "connecting";
    this.connectionCallback = callback;
    // Setting Device
    this.device = new window.epson.ePOSPrint(
      `http://${this.ipAddress}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=2000`
    );
    // Setting Device Handlers
    this.device.ononline = this.onOnline;
    this.device.onoffline = this.onOffline;
    this.device.onpoweroff = this.onOffline;
    this.device.send();
  }

  public reconnect() {
    if (this.connectionCallback) {
      this.connectionCallback("connecting");
      this.connect(this.connectionCallback);
    }
  }

  private onOnline = () => {
    console.log(`Printer (${this.ipAddress}) is online`);
    if (this.instruction === "isOnline" && this.connectionCallback) {
      this.status = "online";
      this.connectionCallback("online");
    }
  };

  private onOffline = () => {
    console.log(`Printer (${this.ipAddress}) is offline`);
    if (this.instruction === "isOnline" && this.connectionCallback)
      this.connectionCallback("offline");
  };

  public printTest = () => {
    if (this.status === "offline") {
      throw new Error("Cannot print with printer offline");
    }

    // TODO: Handle success/failure with callback

    var builder = new window.epson.ePOSBuilder();
    builder.addTextAlign(builder.ALIGN_CENTER);
    builder.addTextStyle(false, false, true, builder.COLOR_1);
    builder.addText("¡Impresión de Prueba Exitosa!");
    builder.addFeedLine(3);
    builder.addCut(builder.CUT_FEED);

    this.device.send(builder.toString());
  };

  private sendPrintJob = (printJobString: string) => {
    this.device.send(printJobString);
  };

  protected createPrint = () => {
    if (this.status === "offline") {
      throw new Error("Cannot print with printer offline");
    }

    return {
      writter: new window.epson.ePOSBuilder(),
      sender: this.sendPrintJob,
    };
  };
}
