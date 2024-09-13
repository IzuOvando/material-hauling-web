import React from "react";
import ReactDOMServer from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

export default function generateQRString(value: string): string {
  const svgQRCode = ReactDOMServer.renderToStaticMarkup(
    <QRCodeSVG
      value={value}
      size={256}
      bgColor="#ffffff"
      fgColor="#000000"
      level="Q"
    />
  );

  return svgQRCode;
}
