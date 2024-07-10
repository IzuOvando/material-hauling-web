type connectionCallbackType = (
  status: "online" | "offline" | "connecting" | "paperEnd"
) => void;

type onReceiveCallbackType = (
  printJobId: string,
  success: boolean,
  error: string,
  warning: string
) => void;

export default class EpsonPrinter {
  private ipAddress: string;
  private device: any;
  private status: "online" | "offline" | "connecting" | "paperEnd";

  private connectionCallback: connectionCallbackType | null = null;
  private onReceiveCallback: onReceiveCallbackType | null = null;

  constructor(ipAddress: string, connectionCallback: connectionCallbackType) {
    this.ipAddress = ipAddress;
    this.status = "connecting";
    // Connecting to printer
    this.connect(connectionCallback);
  }

  public connect(callback: connectionCallbackType) {
    console.debug(`Connecting to printer (${this.ipAddress})...`);
    this.status = "connecting";
    this.connectionCallback = callback;
    // Setting Device
    this.device = new window.epson.ePOSPrint(
      `https://${this.ipAddress}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=5000`
    );
    // Setting Device Handlers
    this.device.ononline = this.onOnline;
    this.device.onoffline = this.onOffline;
    this.device.onpoweroff = this.onOffline;
    this.device.onreceive = this.onReceive;
    this.device.onpapernearend = this.onPaperNearEnd;
    this.device.onpaperend = this.onPaperEnd;
    this.device.send();
  }

  public reconnect() {
    if (this.connectionCallback) {
      this.connectionCallback("connecting");
      this.connect(this.connectionCallback);
    }
  }

  private onOnline = () => {
    console.debug(`Printer (${this.ipAddress}) is online`);
    if (this.connectionCallback) {
      this.status = "online";
      this.connectionCallback("online");
    }
  };

  private onOffline = () => {
    console.debug(`Printer (${this.ipAddress}) is offline`);
    if (this.connectionCallback) this.connectionCallback("offline");
  };

  private onPaperNearEnd = () => {
    console.debug(`Paper is near the end for printing`);
  };

  private onPaperEnd = () => {
    if (this.connectionCallback) this.connectionCallback("paperEnd");
  };

  public printTest = () => {
    if (this.status === "offline") {
      throw new Error("Cannot print with printer offline");
    }

    var builder = new window.epson.ePOSBuilder();
    builder.addTextAlign(builder.ALIGN_CENTER);
    builder.addTextStyle(false, false, true, builder.COLOR_1);
    builder.addText("¡Impresión de Prueba Exitosa!");
    builder.addFeedLine(3);
    builder.addCut(builder.CUT_FEED);

    this.device.send(builder.toString(), "test");
  };

  private sendPrintJob = (printJobString: string, printJobId: string) => {
    this.device.send(printJobString, printJobId);
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

  public setHandlePrintResponse = (callback: onReceiveCallbackType) => {
    this.onReceiveCallback = callback;
  };

  private onReceive = (res: any) => {
    if (res.printjobid == "test") return;

    var asb = res.status;
    var warning = "";

    if (asb & this.device.ASB_RECEIPT_NEAR_END) {
      warning = "Paper near end";
    }

    if (this.onReceiveCallback) {
      this.onReceiveCallback(res.printjobid, res.success, res.code, warning);
    }
  };
}
